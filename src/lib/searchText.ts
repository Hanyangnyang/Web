// 검색용 텍스트 정규화 — 제휴 매장·교내시설 등 검색하는 모든 곳이 같은 규칙을 쓰도록 한 곳에 모아둔다.
// (규칙이 바뀌면 여기만 고치면 된다. 예: 나중에 초성 검색을 넣는다면)

/** 띄어쓰기·대소문자 무시 (데이터셋이 작아 실시간 연산 비용은 무시 가능) */
export function normalizeForSearch(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

/** 정규화 후 부분 문자열 포함 여부 — '1공학'으로 '제1공학관'이 잡히는 근거 */
export function matchesQuery(target: string, normalizedQuery: string): boolean {
  return normalizeForSearch(target).includes(normalizedQuery);
}
