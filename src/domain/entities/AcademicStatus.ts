// 도메인 엔티티: 학사 및 셔틀/시설 통합 운영 상태 (새 백엔드 /api/v1/academic/status)
// 특정 날짜의 공휴일 여부, 현재 학기 구분(학기중/방학중/계절학기), 셔틀 운행 기준(평일/주말/미운행)을 한 번에 담는다
export type DayType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'NO_OPERATION';
export type Semester = 'FIRST' | 'SECOND';
export type PeriodType = 'SEMESTER' | 'SEASONAL' | 'VACATION';

export interface CalendarStatus {
  dayType: DayType;
  isHoliday: boolean;
  holidayName: string;
}

export interface AcademicSchedule {
  year: number;
  semester: Semester;
  periodType: PeriodType;
  title: string;
}

export interface ShuttleOperationStatus {
  isOperating: boolean;
  periodType: PeriodType;
  dayType: DayType;
  noOperationReason: string;
}

export interface AcademicStatus {
  date: string;
  calendar: CalendarStatus;
  academic: AcademicSchedule;
  shuttle: ShuttleOperationStatus;
}

export function createAcademicStatus(raw: AcademicStatus): AcademicStatus {
  return {
    date: raw.date,
    calendar: { ...raw.calendar },
    academic: { ...raw.academic },
    shuttle: { ...raw.shuttle },
  };
}
