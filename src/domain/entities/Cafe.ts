// 도메인 엔티티: 학생식당 정보 및 메뉴 아이템

export interface MenuItem {
  type: string;
  menu: string;
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
  menus?: MenuItem[];
  hasJeyuk?: boolean;
  available?: boolean;
  hours?: CafeHours;
}

export interface Cafe {
  id: string;
  name: string;
  menus: MenuItem[];
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
