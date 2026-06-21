/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Periodic Background Sync API (Chrome only, not in standard TS webworker lib)
interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string;
}

const CACHE_NAME = 'app-shell-v1';
const AUTH_CACHE = 'pool-auth-state';
const SYNC_CACHE = 'pool-sync-state';
const SYNC_TAG = 'pool-check';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(self.__WB_MANIFEST.map((e) => e.url)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([CACHE_NAME, AUTH_CACHE, SYNC_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)),
        )
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ?? fetch(event.request)
    ),
  );
});

interface SwSession {
  supabaseUrl: string;
  supabaseAnonKey: string;
  accessToken: string | null;
  refreshToken: string | null;
}

async function getSession(): Promise<SwSession | null> {
  const cache = await caches.open(AUTH_CACHE);
  const response = await cache.match('session');
  if (!response) return null;
  return response.json() as Promise<SwSession>;
}

async function getLastSeenId(): Promise<string | null> {
  const cache = await caches.open(SYNC_CACHE);
  const response = await cache.match('last-seen-id');
  return response ? response.text() : null;
}

async function setLastSeenId(id: string): Promise<void> {
  const cache = await caches.open(SYNC_CACHE);
  await cache.put('last-seen-id', new Response(id));
}

async function refreshAccessToken(session: SwSession): Promise<string | null> {
  if (!session.refreshToken) return null;
  try {
    const refreshUrl =
      `${session.supabaseUrl}/auth/v1/token?grant_type=refresh_token`;
    const res = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: session.supabaseAnonKey,
      },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
    };
    session.accessToken = data.access_token;
    session.refreshToken = data.refresh_token;
    const cache = await caches.open(AUTH_CACHE);
    await cache.put('session', new Response(JSON.stringify(session)));
    return data.access_token;
  } catch {
    return null;
  }
}

async function checkForNewAnalysis(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const url = new URL(`${session.supabaseUrl}/rest/v1/pool_closure_analysis`);
  url.searchParams.set('select', 'id,closure_date,reopening_date');
  url.searchParams.set('order', 'created_at.desc');
  url.searchParams.set('limit', '1');

  const makeRequest = (token: string | null) =>
    fetch(url.toString(), {
      headers: {
        apikey: session.supabaseAnonKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response: Response;
  try {
    response = await makeRequest(session.accessToken);
    if (response.status === 401) {
      const newToken = await refreshAccessToken(session);
      if (!newToken) return;
      response = await makeRequest(newToken);
    }
  } catch {
    return;
  }

  if (!response.ok) return;

  const results = (await response.json()) as Array<{
    id: string;
    closure_date: string | null;
    reopening_date: string | null;
  }>;

  const latest = results[0];
  if (!latest) return;

  const lastSeenId = await getLastSeenId();
  if (latest.id === lastSeenId) return;

  await setLastSeenId(latest.id);

  if (!latest.closure_date && !latest.reopening_date) return;

  let body: string;
  if (latest.closure_date && latest.reopening_date) {
    body = `Pool closed until ${latest.reopening_date}.`;
  } else if (latest.closure_date) {
    body = 'Pool is currently closed.';
  } else {
    body = `Pool reopens on ${latest.reopening_date}.`;
  }

  await self.registration.showNotification('Mt. Rainier Pool Update', {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: SYNC_TAG,
    data: { url: self.registration.scope },
  });
}

function isPeriodicSyncEvent(event: Event): event is PeriodicSyncEvent {
  return 'tag' in event &&
    typeof (event as Record<string, unknown>).tag === 'string';
}

self.addEventListener('periodicsync', (event) => {
  if (isPeriodicSyncEvent(event) && event.tag === SYNC_TAG) {
    event.waitUntil(checkForNewAnalysis());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl: string = event.notification.data?.url ??
    self.registration.scope;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.startsWith(self.registration.scope) && 'focus' in client
          ) {
            return (client as WindowClient).focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});

self.addEventListener('message', async (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SESSION_UPDATE') {
    const { supabaseUrl, supabaseAnonKey, accessToken, refreshToken } = event
      .data as SwSession & { type: string };
    const cache = await caches.open(AUTH_CACHE);
    await cache.put(
      'session',
      new Response(
        JSON.stringify({
          supabaseUrl,
          supabaseAnonKey,
          accessToken,
          refreshToken,
        }),
      ),
    );
  }

  if (event.data?.type === 'TRIGGER_CHECK') {
    event.waitUntil(checkForNewAnalysis());
  }
});
