// 카카오맵 SDK(dapi.kakao.com) 스크립트를 스플래시 종료 시점에 미리 로드
import { Loader, type Libraries } from 'react-kakao-maps-sdk';

export const KAKAO_MAP_LIBRARIES: Libraries = ['clusterer', 'services'];

export function prefetchKakaoMapSdk() {
  const appkey = import.meta.env.VITE_KAKAO_JS_KEY;
  if (!appkey) return;
  new Loader({ appkey, libraries: KAKAO_MAP_LIBRARIES }).load().catch(() => {
    // 실패해도 무시 — 실제 탭 진입 시 CampusMapView의 useKakaoLoader가 다시 시도한다
  });
}
