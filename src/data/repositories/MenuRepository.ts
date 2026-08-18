// 레포지토리: 학식 API 응답을 Cafe 엔티티 배열로 변환
import { createCafe } from '../../domain/entities/Cafe.js';
import type { MenuApiDataSource, MenuItemDto } from '../datasources/MenuApiDataSource.js';
import type { MenuRepository } from '../../domain/repositories/IMenuRepository.js';

const MEAL_TYPE_LABEL: Record<MenuItemDto['mealType'], string> = {
  BREAKFAST: '조식',
  LUNCH: '중식',
  DINNER: '석식',
};

export const createMenuRepository = (
  { menuApiDataSource }: { menuApiDataSource: MenuApiDataSource }
): MenuRepository => ({
  getMenus: async (dateStr: string) => {
    const res = await menuApiDataSource.getMenus({ startDate: dateStr, endDate: dateStr });
    if (!res.success) return [];

    const cafeterias = res.data?.[dateStr] ?? [];
    return cafeterias.map(c => createCafe({
      id: c.cafeteriaCode.toLowerCase(),
      name: c.name,
      hours: c.operatingHours,
      available: c.menu.length > 0,
      hasJeyuk: c.menu.some(m => m.rawMenu.includes('제육')),
      menus: c.menu.map(m => ({
        type: MEAL_TYPE_LABEL[m.mealType] ?? m.mealType,
        menu: m.menuItems.join('\n'),
        price: `${m.price.toLocaleString('ko-KR')}원`,
      })),
    }));
  },
});
