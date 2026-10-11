import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

// Capacitor 미설치 환경(브라우저)에서도 안전하게 동작
export const isNativeApp = (): boolean => Capacitor.isNativePlatform() === true;
export const getPlatform = (): Platform => (Capacitor.getPlatform() as Platform) ?? 'web';

// iOS 네이티브 앱(WKWebView) + 아이폰/아이패드 브라우저(Safari 등) 둘 다 감지 —
// getPlatform()은 Capacitor 네이티브 플랫폼만 구분해서 'web'(모바일 브라우저 포함)은 못 걸러냄.
// iOS Safari 자동재생 정책처럼 "iOS 기기냐 아니냐"가 중요한 곳에 씀 (Android/데스크톱 브라우저는 제외)
export const isIOSDevice = (): boolean => {
  if (getPlatform() === 'ios') return true;
  if (typeof navigator === 'undefined') return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  // iPadOS 13+ Safari는 UA를 Mac으로 위장하지만 터치 포인트로 구분 가능
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
};
