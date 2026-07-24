'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('AuditApp PWA ServiceWorker zarejestrowany pomyślnie:', reg.scope);
          })
          .catch((err) => {
            console.error('Błąd rejestracji PWA ServiceWorker:', err);
          });
      });
    }
  }, []);

  return null;
}
