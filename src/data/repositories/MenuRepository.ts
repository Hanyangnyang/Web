// 레포지토리: 학식 API 응답을 Cafe 엔티티 배열로 변환
import { apiError, withAreaTag } from '../../infrastructure/http/HttpClient.js';
import { createCafe, KNOWN_CAFES } from '../../domain/entities/Cafe.js';
import type { MenuApiDataSource, MenuDto, CafeteriaDto } from '../datasources/MenuApiDataSource.js';
import type { MenuRepository } from '../../domain/repositories/IMenuRepository.js';

const AREA = '학식'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

const MEAL_TYPE_LABEL: Record<MenuDto['mealType'], string> = {
  BREAKFAST: '조식',
  LUNCH: '중식',
  DINNER: '석식',
};

// KNOWN_CAFES 기준으로 항상 4개를 다 채워서 리턴 — API가 일부 식당을 안 줘도
// 그 식당은 자동으로 빈 껍데기가 되어, 진짜 API 실패와 "오늘 메뉴 없음"이 구분된다
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
      menus: [...c.menu]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(m => ({
          type: MEAL_TYPE_LABEL[m.mealType] ?? m.mealType,
          menuItems: m.menuItems ?? [],
          price: typeof m.price === 'number' ? `${m.price.toLocaleString('ko-KR')}원` : '',
        })),
    });
  });
}

export const createMenuRepository = (
  { menuApiDataSource }: { menuApiDataSource: MenuApiDataSource }
): MenuRepository => ({
  getMenuForPeriod: () => withAreaTag(AREA, async () => {
    const res = await menuApiDataSource.getMenuForPeriod();
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `menu API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    return Object.fromEntries(
      Object.entries(res.data ?? {}).map(([dateStr, cafeterias]) => {
        // 2. data가 배열 형태로 오지 않았을때, Error 반환
        if (!Array.isArray(cafeterias))
          throw apiError(`menu API returned invalid shaped 'data': ${JSON.stringify(cafeterias)}`, { area: AREA, endpoint: res._requestUrl });
        return [dateStr, toCafes(cafeterias)];
      })
    );
  }),
});
