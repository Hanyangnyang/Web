// 카카오맵 SDK(dapi.kakao.com) 스크립트를 스플래시 종료 시점에 미리 로드
import { Loader, type Libraries } from 'react-kakao-maps-sdk';

export const KAKAO_MAP_LIBRARIES: Libraries = ['clusterer', 'services'];

export function prefetchKakaoMapSdk() {
  const appkey = import.meta.env.VITE_KAKAO_JS_KEY;
  if (!appkey) return;
  new Loader({ appkey, libraries: KAKAO_MAP_LIBRARIES }).load().catch(() => {
    console.warn('카카오맵 SDK 로드 실패 — 지도 기능이 정상 동작하지 않을 수 있음');
  });
}
