import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

// Capacitor 미설치 환경(브라우저)에서도 안전하게 동작
export const isNativeApp = (): boolean => Capacitor.isNativePlatform() === true;
export const getPlatform = (): Platform => (Capacitor.getPlatform() as Platform) ?? 'web';

// 모바일 브라우저/PWA로 접속한 안드로이드 사용자 (Capacitor 네이티브 앱은 제외)
export const isAndroidWeb = (): boolean =>
  getPlatform() === 'web' && typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
