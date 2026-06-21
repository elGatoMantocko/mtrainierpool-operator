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

function triggerCheckViaSW() {
  navigator.serviceWorker?.controller?.postMessage({ type: 'TRIGGER_CHECK' });
}

export function usePeriodicSync() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      location.reload();
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') triggerCheckViaSW();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const setup = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission !== 'granted') return;

      triggerCheckViaSW();

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

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
