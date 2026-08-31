// 바텀시트 높이의 단일 출처.
// 시트 자신뿐 아니라 (1) 시트 위에 떠 있어야 하는 플로팅 버튼(점메추·내 위치)과
// (2) 마커를 '시트 제외 영역 정중앙'에 놓는 지도 포커스 계산이 모두 같은 값을 봐야 해서 여기 모은다.
// 값이 흩어져 있으면 시트 종류마다 높이가 다른 지금 구조에서 버튼이 시트 안으로 파고든다.

// 퍼센트 높이는 비율(0~1)로 둔다 — 지도 포커스 계산(useCampusMapFocus)이 비율을 그대로 쓰기 때문
export const STORE_DETAIL_FRACTION = 0.45;
export const STORE_LIST_EXPANDED_FRACTION = 0.52;
export const BUILDING_DETAIL_MAX_FRACTION = 0.55;
export const BUILDING_DETAIL_FRACTION = 0.4;
export const BUILDING_LIST_FRACTION = 0.45;
export const SMOKING_DETAIL_FRACTION = 0.32;
export const SMOKING_LIST_FRACTION = 0.45;

// ── 하단 플로팅 BottomNav를 피하기 위한 여백 (88px = BottomNav.tsx의 bottom-24px + h-16) ──
// 시트는 nav가 위로 지나가도록 화면 끝까지 연장하고, 콘텐츠만 이 여백만큼 비워 가려지지 않게 한다.
// 쓰임새가 둘이라 형태도 둘인데, 값은 반드시 같이 움직여야 한다. nav 높이가 바뀌면 여기 두 줄만 고치면 된다.
//  - CLASS: 시트 스크롤 영역의 padding-bottom. Tailwind 임의값은 빌드 때 소스에서 문자열 그대로
//           스캔되므로 변수로 조립할 수 없고(조립하면 스타일이 통째로 누락된다) 리터럴이어야 한다.
//           같은 이유로 임의값 안에는 공백을 넣을 수 없다.
//  - CSS  : 시트가 없을 때 플로팅 버튼이 딛고 설 바닥. 일반 CSS 값이라 공백을 써도 된다.

/** 시트 스크롤 영역 하단 여백 (Tailwind 클래스) */
export const NAV_CLEARANCE_CLASS = 'pb-[calc(88px+env(safe-area-inset-bottom,0px))]';

/** 시트가 없을 때 버튼이 기준으로 삼을 높이 (CSS 길이) */
export const NAV_CLEARANCE_CSS = 'calc(88px + env(safe-area-inset-bottom, 0px))';

/**
 * 접힌 리스트 높이 — 매장·교내시설·오픈스페이스·흡연장이 **같은 값**을 쓴다.
 */
export const LIST_COLLAPSED_CSS = 'calc(72px + 96px + env(safe-area-inset-bottom, 0px))';


/** 비율 → CSS 길이 */
export function toCssHeight(fraction: number): string {
  return `${fraction * 100}%`;
}
