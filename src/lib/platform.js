import { Capacitor } from '@capacitor/core';

// Capacitor 미설치 환경(브라우저)에서도 안전하게 동작
export const isNativeApp = () => Capacitor.isNativePlatform() === true;
export const getPlatform = () => Capacitor.getPlatform() ?? 'web'; // 'ios' | 'android' | 'web'

// Android 네이티브에서 WebView UA에 직접 주입한 식별자로 판단
// navigator.userAgent는 JS 실행 전부터 항상 동기적으로 존재
export const isCapacitorApp = () => navigator.userAgent.includes('HanyangAndroidApp');
