// 레포지토리: 학식 API 응답을 Cafe 엔티티 배열로 변환
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createCafe, KNOWN_CAFES } from '../../domain/entities/Cafe.js';
import type { MenuApiDataSource } from '../datasources/MenuApiDataSource.js';
import type { MenuRepository } from '../../domain/repositories/IMenuRepository.js';
import { toDateKey } from '../../utils/time.js';
import {
  MenuResponseDataSchema,
  CafeteriaListDataSchema,
  CafeteriaDtoSchema,
  MenuDtoSchema,
  type CafeteriaDto,
} from '../schemas/MenuSchema.js';

const AREA = '학식'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

const MEAL_TYPE_LABEL: Record<string, string> = {
  BREAKFAST: '조식',
  LUNCH: '중식',
  DINNER: '석식',
};

// raw가 배열 형태가 아니면(구조적으로 잘못된 응답) Error 반환 — 날짜 하나가 깨졌다고 조용히
// "메뉴 없음"으로 감추면 진짜 장애와 구분이 안 되기 때문에 일부러 관대하게 처리하지 않는다.
// 배열 안 개별 식당 항목은 하나가 이상해도(cafeteriaCode 누락 등) 그 식당만 걸러낸다
function parseCafeterias(raw: unknown, endpoint?: string): CafeteriaDto[] {
  const parsed = CafeteriaListDataSchema.safeParse(raw);
  if (!parsed.success)
    throw apiError(
      `menu API returned invalid shaped 'data': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      { area: AREA, endpoint }
    );

  return parsed.data
    .map(c => CafeteriaDtoSchema.safeParse(c))
    .filter(r => r.success)
    .map(r => r.data);
}

// KNOWN_CAFES 기준으로 항상 4개를 다 채워서 리턴 — API가 일부 식당을 안 줘도
// 그 식당은 자동으로 빈 껍데기가 되어, 진짜 API 실패와 "오늘 메뉴 없음"이 구분된다
function toCafes(cafeterias: CafeteriaDto[]) {
  const byId = new Map<string, CafeteriaDto>(cafeterias.map(c => [c.cafeteriaCode.toLowerCase(), c]));

  return KNOWN_CAFES.map(({ id, name }) => {
    const c = byId.get(id);
    if (!c) return createCafe({ id, name });

    // 메뉴 항목도 하나가 이상하면(가격/타입 필드 이상) 그 메뉴만 제외
    const menus = c.menu
      .map(m => MenuDtoSchema.safeParse(m))
      .filter(r => r.success)
      .map(r => r.data);

    return createCafe({
      id,
      name: c.name,
      hours: c.operatingHours,
      available: menus.length > 0,
      hasJeyuk: menus.some(m => m.rawMenu.includes('제육')),
      menus: [...menus]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(m => ({
          type: MEAL_TYPE_LABEL[m.mealType] ?? m.mealType,
          menuItems: m.menuItems,
          price: m.price !== null ? `${m.price.toLocaleString('ko-KR')}원` : '',
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
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `menu API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    const responseData = MenuResponseDataSchema.parse(res.data);
    const cafeterias = parseCafeterias(responseData[dateStr] ?? [], res._requestUrl);
    return toCafes(cafeterias);
  },

  getMenuForPeriod: async () => {
    const res = await menuApiDataSource.getMenuForPeriod();
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `menu API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    const responseData = MenuResponseDataSchema.parse(res.data);
    return Object.fromEntries(
      Object.entries(responseData).map(([dateStr, cafeterias]) => [
        dateStr,
        toCafes(parseCafeterias(cafeterias, res._requestUrl)),
      ])
    );
  },
});
