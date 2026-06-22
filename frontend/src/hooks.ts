import { useEffect } from 'react';

function triggerCheckViaSW() {
  navigator.serviceWorker?.controller?.postMessage({ type: 'TRIGGER_CHECK' });
}

export function usePoolNotifications() {
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
    };

    setup();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
