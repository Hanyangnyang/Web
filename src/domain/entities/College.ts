// 도메인 엔티티: 단과대
//
// 교내시설의 주요 단과대, 검색 결과, 앞으로 늘어날 다른 탭까지 같은 목록·이모지·표기를 쓴다. 
//
// 색상은 여기 없다: Tailwind 클래스는 UI 관심사라
// presentation/components/ui/collegeStyle.ts가 이 id를 키로 삼아 따로 들고 있다.

import { normalizeForSearch } from '../../lib/text.js';

export interface College {
  id: string;
  name: string;
  emoji: string;
  displayName?: string;
}

// 정렬은 id 순서 그대로가 곧 화면 노출 순서다 (필터 드롭다운이 이 배열을 그대로 쓴다)
export const COLLEGES: College[] = [
  { id: '1',  name: 'LIONS칼리지',         emoji: '🦁', displayName: 'LIONS\n칼리지' },
  { id: '2',  name: '커뮤니케이션&컬쳐대학', emoji: '📢' , displayName: '커뮤니케이션\n&컬쳐대학'},
  { id: '3',  name: '공학대학',             emoji: '⚙️' },
  { id: '4',  name: '약학대학',             emoji: '💊' },
  { id: '5',  name: '디자인대학',           emoji: '🎨', displayName: '디자인\n대학' },
  { id: '6',  name: '글로벌문화통상대학',    emoji: '🌍', displayName: '글로벌문화\n통상대학' },
  { id: '7',  name: '경상대학',             emoji: '📊' },
  { id: '8',  name: '소프트웨어융합대학',    emoji: '💻', displayName: '소프트웨어\n융합대학' },
  { id: '9',  name: '예체능대학',           emoji: '🎵', displayName: '예체능\n대학' },
  { id: '10', name: '첨단융합대학',         emoji: '🚀', displayName: '첨단융합\n대학' },
];

const BY_ID = new Map(COLLEGES.map((c) => [c.id, c]));
// 이름 키는 정규화(공백 제거·소문자)해서 담는다.
// 'LIONS칼리지'와 'LIONS 칼리지'처럼 손으로 관리하는 JSON의 띄어쓰기 흔들림 때문에
// 칩 색·이모지가 조용히 빠지는 일이 반복돼서, 조회 단계에서 흡수하기로 했다.
const BY_NAME = new Map(COLLEGES.map((c) => [normalizeForSearch(c.name), c]));

export function collegeById(id: string): College | undefined {
  return BY_ID.get(id);
}

/**
 * 이름으로 찾는다. 교내시설 데이터(campusBuildings.json의 primaryColleges)가 id가 아니라
 * 이름 문자열을 담고 있어서 필요하다. 띄어쓰기 차이는 무시한다.
 * '대학본부'·'학군단'처럼 단과대가 아닌 값도 들어오므로
 * 못 찾는 게 정상적인 경우다 — 호출부가 undefined를 처리해야 한다.
 */
export function collegeByName(name: string): College | undefined {
  return BY_NAME.get(normalizeForSearch(name));
}

/**
 * 좁은 칩에 넣을 표기를 고른다.
 * 모르는 id면 데이터가 준 이름(예: partnerships.json의 college_name)으로 물러선다 —
 * 목록에 없는 단과대가 생겨도 칸이 비어 보이지 않게.
 */
export function collegeLabel(id: string, fallbackName: string): string {
  const college = BY_ID.get(id);
  return college?.displayName ?? college?.name ?? fallbackName;
}
