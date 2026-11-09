import { Capacitor } from '@capacitor/core';

/**
 * Returns the appropriate API base URL depending on the platform (Web, Native iOS, Native Android, Dev Server).
 * Native Capacitor mobile apps will always call the live HTTPS Cloud Functions backend.
 */
export const getApiBaseUrl = () => {
  // 1. Capacitor Native (Android & iOS)
  if (Capacitor.isNativePlatform()) {
    return 'https://app.move.com.tr';
  }

  // 2. Browser Environment (Localhost, app.move.com.tr, move-yanimda.web.app)
  // Relative path '' ensures same-origin requests without CORS preflight delays.
  if (typeof window !== 'undefined') {
    return '';
  }

  // 3. Fallback
  return 'https://app.move.com.tr';
};
