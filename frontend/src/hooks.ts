import { useEffect } from 'react';

const SYNC_TAG = 'pool-check';
const SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  getTags(): Promise<string[]>;
}

function hasPeriodicSync(
  reg: ServiceWorkerRegistration,
): reg is ServiceWorkerRegistration & { periodicSync: PeriodicSyncManager } {
  return 'periodicSync' in reg &&
    typeof (reg as Record<string, unknown>).periodicSync === 'object';
}

export function usePeriodicSync() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      location.reload();
    });

    const setup = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      if (!hasPeriodicSync(registration)) return;

      const tags = await registration.periodicSync.getTags();
      if (!tags.includes(SYNC_TAG)) {
        await registration.periodicSync.register(SYNC_TAG, {
          minInterval: SYNC_INTERVAL_MS,
        });
      }
    };

    setup();
  }, []);
}
