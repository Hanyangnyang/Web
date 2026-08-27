// 학식 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

// 개별 메뉴(조식/중식/석식) 항목. 항목 하나가 이상해도 그 메뉴만 빠지게 하고 싶어서 상위
// 스키마에 배열로 중첩하지 않고 Repository에서 항목별로 개별 parse한다.
// mealType은 모르는 값이 와도 원본 값 그대로 통과시키므로(MEAL_TYPE_LABEL 매핑) 문자열로만 받는다
export const MenuDtoSchema = z.object({
  mealType: z.string(),
  displayOrder: z.number().catch(0),
  price: z.number().nullable().catch(null),
  menuItems: z.array(z.string()).catch([]),
  rawMenu: z.string().catch(''),
});

// 개별 식당. 항목 하나가 이상해도(cafeteriaCode 누락 등) 그 식당만 빠지게 하고 싶어서 상위
// 스키마에 배열로 중첩하지 않고 Repository에서 항목별로 개별 parse한다
export const CafeteriaDtoSchema = z.object({
  cafeteriaCode: z.string(),
  name: z.string(),
  operatingHours: z.record(z.string(), z.string()).catch({}),
  menu: z.array(z.unknown()).catch([]), // 개별 항목 검증은 MenuDtoSchema로 Repository에서 수행
});

// 특정 날짜의 식당 목록. 배열이 아니면(구조적으로 잘못된 응답) 그대로 실패시켜서 Repository가
// apiError로 던지게 한다 — 조용히 빈 목록으로 감추면 진짜 장애가 "오늘 학식 없음"과 구분이
// 안 되기 때문에 여기선 일부러 관대하게 처리하지 않는다
export const CafeteriaListDataSchema = z.array(z.unknown());

// 최상위 응답은 날짜를 키로 하는 동적 객체 — 완전히 다른 모양으로 와도({} 대체) 날짜별 개별
// 검증(CafeteriaListDataSchema)이 실제 방어를 담당하므로 여기선 통과 자체만 보장한다
export const MenuResponseDataSchema = z.record(z.string(), z.unknown()).catch({});

export type MenuDto = z.infer<typeof MenuDtoSchema>;
export type CafeteriaDto = z.infer<typeof CafeteriaDtoSchema>;
