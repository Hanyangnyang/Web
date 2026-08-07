// 훅: 카카오맵 현재 화면(뷰포트) 경계 추적 — 건물/흡연장 리스트를 '지금 화면에 보이는 것만'으로 좁히는 데 쓴다
import { useCallback, useMemo, useState } from 'react';

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

export function isWithinBounds(bounds: MapBounds, lat: number, lng: number): boolean {
  return lat >= bounds.swLat && lat <= bounds.neLat && lng >= bounds.swLng && lng <= bounds.neLng;
}

function readBounds(map: kakao.maps.Map): MapBounds {
  const b = map.getBounds();
  const sw = b.getSouthWest();
  const ne = b.getNorthEast();
  return { swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() };
}

export function usePartnerMapBounds(map: kakao.maps.Map | null) {
  // 팬·줌이 끝났을 때(onIdle)마다 갱신되는 값 — Map의 onIdle 이벤트 콜백에서만 채워진다
  const [idleBounds, setIdleBounds] = useState<MapBounds | null>(null);
  const onIdle = useCallback((m: kakao.maps.Map) => setIdleBounds(readBounds(m)), []);

  // 아직 idle이 한 번도 안 났으면(최초 진입 직후) map 인스턴스로 즉시 파생 — effect+setState 없이 렌더 중 계산
  const initialBounds = useMemo(() => (map ? readBounds(map) : null), [map]);

  return { bounds: idleBounds ?? initialBounds, onIdle };
}
