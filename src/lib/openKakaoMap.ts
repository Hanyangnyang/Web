// 카카오맵 장소 페이지를 연다. 네이티브 앱에서는 앱 안 브라우저(Safari View/Chrome Custom Tab)를 사용한다.
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export async function openKakaoMap(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url, presentationStyle: 'popover', toolbarColor: '#FFFFFF' });
      return;
    } catch {
      // Browser 플러그인을 쓸 수 없는 환경에서는 웹과 같은 안전한 폴백으로 연다.
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
