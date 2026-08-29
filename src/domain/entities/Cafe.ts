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
