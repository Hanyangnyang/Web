// 도메인 값 객체: 위경도 한 쌍.
// 매장·교내시설·흡연장이 모두 같은 모양을 쓰도록 한곳에 둔다.
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * 지도에 찍을 수 없는 좌표를 null로 정규화한다 — 데이터 레이어(매퍼) 전용.
 *
 * 손으로 관리하는 JSON이라 '좌표 미확보'가 여러 모양으로 들어온다: 위경도가 null이거나,
 * 한쪽만 채워졌거나, 0으로 남겨졌거나, location 자체가 없거나. 그 전부를 이 경계에서
 * 흡수해 도메인부터는 '없음 = null' 하나만 알면 되게 한다.
 *
 * 0을 '없음'으로 보는 근거: ERICA는 위도 37.29~37.30 / 경도 126.83 언저리라 어느 쪽도
 * 0이 될 수 없다. 이 캠퍼스 좌표계에서 0은 값이 아니라 빈칸 표시다. 그대로 통과시키면
 * 마커가 적도·그리니치 근처에 찍히고 거리 정렬에 수천 km로 끼어든다.
 *
 * 한쪽만 어긋나도 통째로 null로 본다 — 위도만 있는 좌표는 어차피 찍을 수 없다.
 */
export function normalizeCoordinates(
  raw: { latitude?: number | null; longitude?: number | null } | null | undefined,
): Coordinates | null {
  const latitude = raw?.latitude;
  const longitude = raw?.longitude;
  if (latitude == null || longitude == null) return null;
  if (latitude === 0 || longitude === 0) return null;
  return { latitude, longitude };
}
