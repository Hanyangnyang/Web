// 지도 마커의 점 크기 규칙 — 매장·건물·흡연장 세 레이어가 같은 값을 쓴다.
// (점이냐 핀이냐는 '선택 여부'로만 갈리므로 별도 함수 없이 호출부에서 !selected로 판단한다)

// 점 지름(px) 계산의 기준 레벨 — 이 레벨보다 축소될수록(레벨↑) 점도 작아진다.
const DOT_SIZE_BASE_LEVEL = 2;

// 점 지름(px) — 축소될수록(레벨이 높아질수록) 작아져서, 화면상 가까운 위치끼리도
// 점끼리 잘 안 겹치고 "여기 여러 곳이 있구나"가 눈에 들어오게 한다.
export function dotSizePx(level: number): number {
  const stepsOut = Math.max(0, level - DOT_SIZE_BASE_LEVEL);
  return Math.max(3, 9 - stepsOut * 1.5);
}
