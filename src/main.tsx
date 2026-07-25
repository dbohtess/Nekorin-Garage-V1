import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const RELEASE_ID = '2026-07-25-firestore-vehicle-v5';

async function clearLegacyAppCache() {
  try {
    if (localStorage.getItem('nekorin-release-id') === RELEASE_ID) {
      return;
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }

    localStorage.setItem('nekorin-release-id', RELEASE_ID);
  } catch {
    // Cache cleanup must never block the application from opening.
  }
}

void clearLegacyAppCache().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
