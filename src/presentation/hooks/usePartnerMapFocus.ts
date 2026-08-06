// 훅: 캠퍼스맵의 카카오맵 뷰포트(중심·줌) 제어
// 부드러운 줌/이동은 카카오 imperative API(panTo·setLevel animate)로 하므로,
// Map 컴포넌트의 center/level prop은 초기값만 넘기고 이후엔 이 훅을 통해서만 제어한다
import { useCallback, useState } from 'react';

// 학교 앞 상권이 화면에 꽉 차는 기본 확대 수준 (1=최대 확대)
export const DEFAULT_LEVEL = 3;
// 매장/클러스터 포커스 시 당겨지는 확대 수준 (최대 확대 = 모든 마커 개별 표시)
const FOCUS_LEVEL = 1;
// 선택 시 마커가 검색바 하단 ~ 상세 시트(45%) 상단 사이 정중앙에 오도록
// 지도 중심을 남쪽으로 내리는 위도 오프셋 (FOCUS_LEVEL·시트 높이 기준으로 산출)
const FOCUS_CENTER_LAT_OFFSET = 0.00035;

export function usePartnerMapFocus() {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  // 클러스터링 재계산용 — 사용자 핀치줌·imperative 줌 모두 onZoomChanged로 동기화
  const [level, setLevel] = useState(DEFAULT_LEVEL);

  const onZoomChanged = useCallback((m: kakao.maps.Map) => setLevel(m.getLevel()), []);

  // 최대 배율로 부드럽게 당기면서, 시트에 가리지 않는 위치로 센터링
  const focusMap = useCallback((lat: number, lng: number) => {
    if (!map) return;
    const target = new kakao.maps.LatLng(lat - FOCUS_CENTER_LAT_OFFSET, lng);
    map.setLevel(FOCUS_LEVEL, { animate: true, anchor: target });
    map.panTo(target);
  }, [map]);

  const panTo = useCallback((lat: number, lng: number) => {
    map?.panTo(new kakao.maps.LatLng(lat, lng));
  }, [map]);

  return { map, setMap, level, onZoomChanged, focusMap, panTo };
}
