// 레포지토리: 학식 API 응답을 Cafe 엔티티 배열로 변환
import { createCafe, KNOWN_CAFES } from '../../domain/entities/Cafe.js';
import type { MenuApiDataSource, MenuDto, CafeteriaDto } from '../datasources/MenuApiDataSource.js';
import type { MenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { toDateKey } from '../../utils/time.js';

const MEAL_TYPE_LABEL: Record<MenuDto['mealType'], string> = {
  BREAKFAST: '조식',
  LUNCH: '중식',
  DINNER: '석식',
};

function toCafes(cafeterias: CafeteriaDto[]) {
  const byId = new Map<string, CafeteriaDto>(cafeterias.map(c => [c.cafeteriaCode.toLowerCase(), c]));

  return KNOWN_CAFES.map(({ id, name }) => {
    const c = byId.get(id);
    if (!c) return createCafe({ id, name });

    return createCafe({
      id,
      name: c.name,
      hours: c.operatingHours,
      available: c.menu.length > 0,
      hasJeyuk: c.menu.some(m => (m.rawMenu ?? '').includes('제육')),
      menus: c.menu.map(m => ({
        type: MEAL_TYPE_LABEL[m.mealType] ?? m.mealType,
        menuItems: m.menuItems ?? [],
        price: `${m.price.toLocaleString('ko-KR')}원`,
      })),
    });
  });
}

export const createMenuRepository = (
  { menuApiDataSource }: { menuApiDataSource: MenuApiDataSource }
): MenuRepository => ({
  getMenuForDate: async (date: Date) => {
    const dateStr = toDateKey(date);
    const res = await menuApiDataSource.getMenuForDate({ startDate: dateStr, endDate: dateStr });
    // success 실패했을때
    if (!res.success) throw new Error(res.error?.message || 'menu API returned success:false');
    // data가 비어서왔을때 
    const cafeterias = res.data?.[dateStr] ?? [];
    if (!Array.isArray(cafeterias)) throw new Error('menu API returned invalid shape');

    return toCafes(cafeterias);
  },

  getMenuForPeriod: async () => {
    const res = await menuApiDataSource.getMenuForPeriod();
    // success 실패했을때
    if (!res.success) throw new Error(res.error?.message || 'menu API returned success:false');

    return Object.fromEntries(
      Object.entries(res.data ?? {}).map(([dateStr, cafeterias]) => {
        // data가 비어서왔을때 
        if (!Array.isArray(cafeterias)) throw new Error('menu API returned invalid shape');
        return [dateStr, toCafes(cafeterias)];
      })
    );
  },
});
