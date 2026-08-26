// 체대 헬스장 시간표 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

const TIME_PATTERN = /^\d{2}:\d{2}/; // "HH:mm:ss..." — 최소 시:분만 있으면 허용

// 요일별 개별 수업 세션. 배열 안에서 항목 하나가 이상해도 그 항목만 제외하고 싶어서
// (전체를 무효화하지 않기 위해) 상위 스키마에 중첩하지 않고 Repository에서 항목별로 개별 parse한다
export const GymClassSessionDtoSchema = z.object({
  dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI']),
  startTime: z.string().regex(TIME_PATTERN).transform(t => t.slice(0, 5)),
  endTime: z.string().regex(TIME_PATTERN).transform(t => t.slice(0, 5)),
  classId: z.number(),
  className: z.string(),
});

// 기간(학기/계절/방학) 메타데이터. 필드 하나가 이상해도 기간 전체를 못 쓰게 만들지 않도록
// enum/문자열/시간 필드는 .catch()로 기본값 대체 (기존 toGymPeriod의 방어 로직과 동일한 의도)
export const GymPeriodDtoSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  periodType: z.enum(['SEMESTER', 'SEASONAL', 'VACATION']).catch('SEMESTER'),
  title: z.string().catch(''),
  start_date: z.string().catch(''),
  end_date: z.string().catch(''),
  start_time: z.string().regex(TIME_PATTERN).transform(t => t.slice(0, 5)).catch(''),
  end_time: z.string().regex(TIME_PATTERN).transform(t => t.slice(0, 5)).catch(''),
  schedules: z.array(z.unknown()).catch([]), // 개별 항목 검증은 GymClassSessionDtoSchema로 Repository에서 수행
});

export const GymScheduleDataSchema = z.array(GymPeriodDtoSchema);

export type GymClassSessionDto = z.infer<typeof GymClassSessionDtoSchema>;
export type GymPeriodDto = z.infer<typeof GymPeriodDtoSchema>;
