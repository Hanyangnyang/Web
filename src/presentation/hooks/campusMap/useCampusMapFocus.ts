// 훅: 캠퍼스맵의 카카오맵 뷰포트(중심·줌) 제어
// 부드러운 줌/이동은 카카오 imperative API(panTo·setLevel)로 하므로,
// Map 컴포넌트의 center/level prop은 초기값만 넘기고 이후엔 이 훅을 통해서만 제어한다
import { useCallback, useState } from 'react';

// 학교 앞 상권이 화면에 꽉 차는 기본 확대 수준 (1=최대 확대)
export const DEFAULT_LEVEL = 3;
// 매장 포커스 시 맞추는 확대 수준 — 너무 바짝 당기면 주변 건물·길이 하나도 안 보여서
// 기본 배율(DEFAULT_LEVEL)과 같은 수준으로 둔다. 이미 이 배율이면 줌 변화 없이 이동만 한다.
const FOCUS_LEVEL = DEFAULT_LEVEL;

export function useCampusMapFocus() {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  // 마커 렌더링 재계산용 — 사용자 핀치줌·imperative 줌 모두 onZoomChanged로 동기화
  const [level, setLevel] = useState(DEFAULT_LEVEL);

  const onZoomChanged = useCallback((m: kakao.maps.Map) => setLevel(m.getLevel()), []);

  /**
   * 목표 지점이 '바텀시트를 제외한 화면 영역'의 세로 정중앙에 오도록 이동한다.
   * 목표가 지금 화면 밖에 있어도 동일하게 동작한다 (projection이 화면 밖 좌표도 선형으로 환산해준다).
   *
   * @param sheetHeightFraction 곧 뜰 상세 시트가 화면 높이에서 차지하는 비율 (각 Sheet의 *_DETAIL_HEIGHT_FRACTION)
   * @param viewportHeightPx    지도가 그려지는 컨테이너의 픽셀 높이
   * @param targetLevel         맞출 확대 수준. 기본은 FOCUS_LEVEL이고, 대상끼리 몇 미터 단위로 붙어 있는
   *                            레이어(흡연장)만 더 당겨서 본다.
   */
  const focusMap = useCallback((
    lat: number, lng: number, sheetHeightFraction: number, viewportHeightPx: number,
    targetLevel: number = FOCUS_LEVEL,
  ) => {
    if (!map) return;

    // 1) 배율을 먼저 확정한다. setLevel은 중심을 유지하므로 아래 계산이 흐트러지지 않고,
    //    projection도 최종 배율 기준이 되어 정확한 좌표가 나온다.
    //    (여기서 animate를 주면 애니메이션 중의 projection을 읽게 될 수 있어 중심이 어긋난다.)
    if (map.getLevel() !== targetLevel) map.setLevel(targetLevel);

    // 2) 화면 높이 H, 시트 높이 S일 때 보이는 영역은 [0, H-S]이고 그 중앙은 (H-S)/2.
    //    지도 중심은 항상 화면 중앙(H/2)에 그려지므로, 마커는 중심보다 S/2px 위에 있어야 한다.
    //    즉 '마커에서 화면상 S/2px 아래에 있는 좌표'를 새 중심으로 잡으면 된다.
    const proj = map.getProjection();
    const markerPoint = proj.containerPointFromCoords(new kakao.maps.LatLng(lat, lng));
    const shiftDownPx = (sheetHeightFraction * viewportHeightPx) / 2;
    const center = proj.coordsFromContainerPoint(
      new kakao.maps.Point(markerPoint.x, markerPoint.y + shiftDownPx)
    );

    // 3) 부드럽게 이동 (거리가 화면 크기보다 크면 카카오가 알아서 애니메이션 없이 이동한다)
    map.panTo(center);
  }, [map]);

  const panTo = useCallback((lat: number, lng: number) => {
    map?.panTo(new kakao.maps.LatLng(lat, lng));
  }, [map]);

  return { map, setMap, level, onZoomChanged, focusMap, panTo };
}
