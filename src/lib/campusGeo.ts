// 좌표 간 거리 계산 및 표시용 포맷팅 — 캠퍼스맵 여러 곳(매장 마커 배치, 내 위치, 건물/흡연장 거리)에서 공용으로 쓴다

// 캠퍼스 반경 수준의 근거리라 평면 근사로 충분 (위도 1도≈111km, 경도는 위도 37° 기준 ≈88km)
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dy = (lat1 - lat2) * 111_000;
  const dx = (lng1 - lng2) * 88_000;
  return Math.hypot(dx, dy);
}

// 1km 미만은 미터(정수), 1km 이상은 소수점 한 자리 킬로미터로 표기
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 기준점에서 가까운 순으로 정렬하고 각 항목의 거리(m)를 함께 돌려준다.
 * 기준점이 없으면(위치 권한 없음 + 지도 미준비) 거리 없이 원래 순서를 유지한다.
 */
export function sortByDistance<T>(
  items: T[],
  origin: LatLng | null,
  getCoords: (item: T) => { latitude: number; longitude: number },
): { item: T; distance: number | null }[] {
  if (!origin) return items.map((item) => ({ item, distance: null }));
  return items
    .map((item) => {
      const { latitude, longitude } = getCoords(item);
      return { item, distance: distanceMeters(origin.lat, origin.lng, latitude, longitude) };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * 기준점에서 가장 가까운 항목 하나. 기준점이 없으면(위치도 화면 중심도 모름) null —
 * 그땐 목록 순서가 '가까운 순'이 아니므로 첫 항목을 가장 가까운 곳이라 부를 수 없다.
 */
export function nearestTo<T>(
  items: T[],
  origin: LatLng | null,
  getCoords: (item: T) => { latitude: number; longitude: number },
): T | null {
  if (!origin) return null;
  return sortByDistance(items, origin, getCoords)[0]?.item ?? null;
}
