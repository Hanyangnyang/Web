// 도메인 값 객체: 위경도 한 쌍.
// 매장·교내시설·흡연장이 모두 같은 모양을 쓰도록 한곳에 둔다.
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * 지도에 찍을 수 없는 좌표인지.
 * 교내시설·흡연장은 지오코딩 실패분을 0,0으로 남겨두기로 해서 그 값도 '없음'으로 본다.
 */
export function isNullIsland(coords: Coordinates): boolean {
  return coords.latitude === 0 && coords.longitude === 0;
}
