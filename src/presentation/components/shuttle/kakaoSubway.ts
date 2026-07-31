// 카카오 지하철 페이지 열기 — 네이티브 앱이면 인앱 브라우저/외부 브라우저, 웹이면 페이지 리다이렉트
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export async function openKakaoSubway(lineId: string, onWebRedirectStart: () => void): Promise<void> {
  const is4Line = lineId.startsWith('line4-');
  const cacheBuster = new Date().getTime();
  const url = `https://place.map.kakao.com/${is4Line ? 'SES1755' : 'SES44M235'}?t=${cacheBuster}`;

  if (Capacitor.isNativePlatform()) {
    try {
      const platform = Capacitor.getPlatform();
      if (platform === 'android') {
        // @capacitor/app 8.1.0 타입 정의(및 실제 구현)에 openUrl이 없음 — 항상 여기서 던지고
        // 아래 catch의 window.open()으로 폴백되는 것으로 보임(동작은 원본 그대로 유지, 별도 확인 필요)
        await (App as unknown as { openUrl: (options: { url: string }) => Promise<void> }).openUrl({ url });
      } else {
        await Browser.open({ url, presentationStyle: 'popover', toolbarColor: '#FFFFFF' });
      }
    } catch (err) {
      window.open(url, '_blank');
    }
  } else {
    onWebRedirectStart();
    setTimeout(() => { window.location.href = url; }, 1200);
  }
}
