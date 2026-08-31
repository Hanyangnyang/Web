// 도메인 엔티티: 특정 날짜의 평일/주말/공휴일/미운행 상태 (새 백엔드 /api/v1/holidays/date-info)
// academic/status.calendar와 달리 학교 자체 공휴일은 섞이지 않은 순수 공공기념일 기준이라,
// 학교 사정과 무관하게 진짜 대중교통 스케줄을 따르는 지하철 dayType 판정에 쓴다
import type { DayType } from './AcademicStatus.js';

export type { DayType };

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface DateInfo {
  date: string;
  dayOfWeek: DayOfWeek;
  dayType: DayType;
  // 공휴일/휴무 명칭 — 평범한 평일이면 빈 문자열로 내려오는 것으로 보임
  name: string;
}

export function createDateInfo(raw: DateInfo): DateInfo {
  return { ...raw };
}
