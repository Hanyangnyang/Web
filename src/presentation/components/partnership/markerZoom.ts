// 지도 마커 표시 규칙: 선택되지 않은 항목은 배율과 무관하게 항상 점, 선택된 것만 핀으로 강조한다.
// 매장·건물·흡연장 세 레이어가 모두 같은 기준을 쓴다.

export function isDotMode(selected: boolean): boolean {
  return !selected;
}

// 점 지름(px) 계산의 기준 레벨 — 이 레벨보다 축소될수록(레벨↑) 점도 작아진다.
const DOT_SIZE_BASE_LEVEL = 2;

// 점 지름(px) — 축소될수록(레벨이 높아질수록) 작아져서, 화면상 가까운 위치끼리도
// 점끼리 잘 안 겹치고 "여기 여러 곳이 있구나"가 눈에 들어오게 한다.
export function dotSizePx(level: number): number {
  const stepsOut = Math.max(0, level - DOT_SIZE_BASE_LEVEL);
  return Math.max(3, 9 - stepsOut * 1.5);
}
