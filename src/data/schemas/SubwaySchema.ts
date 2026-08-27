// 지하철 시간표 API 응답 스키마 — 런타임 검증과 DTO 타입을 zod 하나로 통일
import { z } from 'zod';

const TIME_PATTERN = /^\d{2}:\d{2}/; // "HH:mm..." — 최소 시:분만 있으면 허용

// 개별 시간표 행. time 형식이 안 맞는 행만 걸러내고 싶어서 상위 스키마에 배열로
// 중첩하지 않고 Repository에서 항목별로 개별 parse한다.
// subwayLine/direction/dayType은 지금 알려진 값 외에 새 값이 와도 죽지 않도록 문자열로만 받는다 —
// Repository의 라벨 매핑(SUBWAY_LINE_ID 등)이 모르는 값이면 원본 값을 그대로 통과시키기 때문
export const SubwayTimetableDtoSchema = z.object({
  subwayLine: z.string(),
  direction: z.string(),
  dayType: z.string(),
  time: z.string().regex(TIME_PATTERN).transform(t => t.slice(0, 5)),
  destination: z.string().catch(''), // 기존에도 문자열이 아니면 ''로 대체하던 필드
  trainNo: z.string().catch(''),     // 기존에 방어가 없던 필드 — 이 값 때문에 행 전체가 빠지지 않도록 관대하게 처리
});

export const SubwayScheduleDataSchema = z.array(z.unknown()); // 개별 항목 검증은 SubwayTimetableDtoSchema로 Repository에서 수행

export type SubwayTimetableDto = z.infer<typeof SubwayTimetableDtoSchema>;
