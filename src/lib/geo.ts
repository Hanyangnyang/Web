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
