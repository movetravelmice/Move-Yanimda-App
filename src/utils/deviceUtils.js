import { Capacitor } from '@capacitor/core';

/**
 * Returns detailed application and device platform information.
 * Uses Capacitor's native runtime detection to reliably distinguish between
 * native iOS (App Store), native Android (Google Play Store), and Web browsers.
 */
export const getAppDeviceInfo = () => {
  let rawPlatform = 'web';
  let isNative = false;

  try {
    rawPlatform = Capacitor.getPlatform(); // 'ios', 'android', 'web'
    isNative = Capacitor.isNativePlatform();
  } catch (e) {
    console.warn("Capacitor platform detection error:", e);
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // Kesin platform tespiti:
  // Native Capacitor container ise ios veya android; değilse web
  let platform = 'web';
  if (isNative) {
    platform = rawPlatform === 'android' ? 'android' : 'ios';
  } else {
    platform = 'web';
  }

  // Tarayıcı ortamındaysa mobil cihaz kontrolü (ek analiz için)
  const isMobileBrowser = !isNative && /iPhone|iPad|iPod|Android/i.test(userAgent);

  return {
    platform,         // 'ios' | 'android' | 'web'
    isNative,         // true (App Store / Play Store yüklü native uygulama) | false (Web)
    rawPlatform,      // Capacitor raw platform
    isMobileBrowser,  // Web tarayıcısından giren mobil cihaz
    userAgent,
    appVersion: '2.4.8'
  };
};
