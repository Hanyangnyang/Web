// 훅: "가장 가까운 곳 하나를 자동으로 골라달라"는 요청을 데이터가 도착한 뒤에 실행한다.
//
// 칩을 누르는 그 순간엔 아직 목록이 없다 — 칩이 켜져야 그 레이어의 조회가 시작되기 때문(RQ enabled).
// 그래서 클릭 시점엔 '예약'만 걸어두고, 로딩이 끝난 뒤 실제로 고른다.
// 캐시가 이미 있으면 예약과 실행이 사실상 같은 순간에 끝나 사용자에겐 즉시 반응으로 보인다.
import { useCallback, useEffect, useRef, useState } from 'react';
import { nearestTo, type LatLng } from '../../../lib/campusGeo.js';
import type { Coordinates } from '../../../domain/entities/Coordinates.js';

interface Params<T> {
  items: T[];
  loading: boolean;
  /** 예약을 건 화면이 아직 유효한가 — 데이터를 기다리는 사이 칩이 바뀌었으면 없던 일로 한다 */
  active: boolean;
  origin: LatLng | null;
  onPick: (item: T) => void;
}

export function useNearestAutoPick<T extends { coordinates: Coordinates }>({
  items, loading, active, origin, onPick,
}: Params<T>) {
  const [pending, setPending] = useState(false);

  // 최신 콜백은 ref로 따라간다 (useBackHandler와 같은 이유). onPick은 매 렌더 새로 만들어지는데
  // 그걸 deps에 넣으면 예약이 걸린 뒤 아무 리렌더에서나 effect가 다시 돌아 판단이 흔들린다.
  const latestPick = useRef(onPick);
  useEffect(() => {
    latestPick.current = onPick;
  });

  useEffect(() => {
    if (!pending) return;
    if (!active) {
      setPending(false);
      return;
    }
    if (loading) return; // 데이터 도착을 계속 기다린다

    setPending(false);
    // 실패해서 목록이 비었거나 기준점이 없으면 아무것도 고르지 않는다 —
    // 엉뚱한 곳으로 지도를 끌고 가느니 그냥 목록을 보여주는 게 낫고, 실패는 시트가 알린다.
    const nearest = nearestTo(items, origin, (item) => item.coordinates);
    if (nearest) latestPick.current(nearest);
  }, [pending, active, loading, items, origin]);

  return useCallback(() => setPending(true), []);
}
