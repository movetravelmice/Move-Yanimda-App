import { Capacitor } from '@capacitor/core';

/**
 * Returns the appropriate API base URL depending on the platform (Web, Native iOS, Native Android, Dev Server).
 * Native Capacitor mobile apps will always call the live HTTPS Cloud Functions backend.
 */
export const getApiBaseUrl = () => {
  // 1. Capacitor Native (Android & iOS)
  if (Capacitor.isNativePlatform()) {
    return 'https://move-yanimda.web.app';
  }

  // 2. Browser Environment
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If local dev server with active port, relative URL is handled by Vite proxy
    if (isLocalhost && window.location.port !== '') {
      return '';
    }
  }

  // 3. Production Web / PWA
  return 'https://move-yanimda.web.app';
};
