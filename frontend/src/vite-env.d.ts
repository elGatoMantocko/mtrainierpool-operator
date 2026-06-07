/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';
  import type { RegisterSWOptions } from 'vite-plugin-pwa/types';

  export type { RegisterSWOptions };

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

declare global {
  interface PeriodicSyncBindOptions {
    minInterval: number;
  }

  interface PeriodicSyncManager {
    register(tag: string, options?: PeriodicSyncBindOptions): Promise<void>;
    getTags(): Promise<string[]>;
    unregister(tag: string): Promise<void>;
  }

  // Extend existing DOM interfaces
  interface ServiceWorkerRegistration {
    readonly periodicSync: PeriodicSyncManager;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    periodicsync: PeriodicSyncEvent;
  }

  interface ExtendableEvent {
    waitUntil(promise: Promise<void>): void;
  }

  interface PeriodicSyncEvent extends ExtendableEvent {
    readonly tag: string;
  }
}
