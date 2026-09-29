'use client';

import { useEffect } from 'react';

export function PwaRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('[pwa] service worker registration failed', error);
      });
    }
  }, []);

  return null;
}
