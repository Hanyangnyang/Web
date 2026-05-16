// Capacitor 미설치 환경(브라우저)에서도 안전하게 동작
export const isNativeApp = () => window.Capacitor?.isNativePlatform() === true;
export const getPlatform = () => window.Capacitor?.getPlatform() ?? 'web'; // 'ios' | 'android' | 'web'
