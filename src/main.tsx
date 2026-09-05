// Global polyfill for Iterator to prevent "ReferenceError: Can't find variable: Iterator"
// in Safari / WebKit and older browser engines
if (typeof (globalThis as any).Iterator === 'undefined') {
  (globalThis as any).Iterator = function () {};
  (globalThis as any).Iterator.prototype = {};
}

// In development mode, unregister any stale service workers from prior production builds
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
