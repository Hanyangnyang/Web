// 훅: 카카오맵의 현재 화면 중심 좌표.
// 위치 권한이 없는 사용자에게 "가까운 순" 정렬 기준점을 주는 용도다 —
// 내 위치를 모르면 '지금 보고 있는 곳'을 기준으로 삼는 게 가장 그럴듯하다.
import { useCallback, useMemo, useState } from 'react';
import type { LatLng } from '../../../lib/campusGeo.js';

function readCenter(map: kakao.maps.Map): LatLng {
  const c = map.getCenter();
  return { lat: c.getLat(), lng: c.getLng() };
}

export function useMapCenter(map: kakao.maps.Map | null) {
  // 팬·줌이 끝났을 때(onIdle)만 갱신한다 — 드래그 중 매 프레임 리렌더를 피하기 위해
  const [idleCenter, setIdleCenter] = useState<LatLng | null>(null);
  const onIdle = useCallback((m: kakao.maps.Map) => setIdleCenter(readCenter(m)), []);

  // 아직 idle이 한 번도 안 났으면(최초 진입 직후) 지도 인스턴스에서 즉시 파생한다.
  // effect + setState로 하면 렌더 연쇄가 생기므로 렌더 중 계산으로 둔다.
  const initialCenter = useMemo(() => (map ? readCenter(map) : null), [map]);

  return { center: idleCenter ?? initialCenter, onIdle };
}
