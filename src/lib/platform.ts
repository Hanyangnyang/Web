import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

// Capacitor 미설치 환경(브라우저)에서도 안전하게 동작
export const isNativeApp = (): boolean => Capacitor.isNativePlatform() === true;
export const getPlatform = (): Platform => (Capacitor.getPlatform() as Platform) ?? 'web';
