// 도메인 엔티티: 학생식당 정보 및 메뉴 아이템
export const KNOWN_CAFES: { id: string; name: string }[] = [
  { id: 're12', name: '학생식당' },
  { id: 're15', name: '창업보육센터' },
  { id: 're11', name: '교직원식당' },
  { id: 're13', name: '기숙사식당' },
];

export interface Menu {
  type: string;
  menuItems: string[];
  price: string;
}

export interface CafeHours {
  조식?: string;
  중식?: string;
  석식?: string;
}

export interface CafeInput {
  id: string;
  name: string;
  menus?: Menu[];
  hasJeyuk?: boolean;
  available?: boolean;
  hours?: CafeHours;
}

export interface Cafe {
  id: string;
  name: string;
  menus: Menu[];
  hasJeyuk: boolean;
  available: boolean;
  hours: CafeHours;
}

export const createCafe = ({ id, name, menus = [], hasJeyuk = false, available = false, hours = {} }: CafeInput): Cafe => ({
  id,
  name,
  menus,
  hasJeyuk,
  available,
  hours,
});

// 배치(period) 조회 응답에 그 날짜 자체가 없을 때 씀 — 백엔드가 그 날짜에 등록된 메뉴가
// 없으면 날짜 키를 아예 빼고 응답하기로 확인됨. API 실패가 아니라 "그날 메뉴 없음"이라
// 재조회 없이 바로 이 빈 4개 식당으로 취급한다
export function createEmptyCafes(): Cafe[] {
  return KNOWN_CAFES.map(({ id, name }) => createCafe({ id, name }));
}
