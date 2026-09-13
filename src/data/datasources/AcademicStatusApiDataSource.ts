// 데이터 소스: 학사 및 셔틀/시설 통합 운영 상태 새 백엔드(/api/v1/academic/status) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export type DayTypeDto = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'NO_OPERATION';
export type SemesterDto = 'FIRST' | 'SECOND';
export type PeriodTypeDto = 'SEMESTER' | 'SEASONAL' | 'VACATION';

export interface CalendarStatusDto {
  dayType: DayTypeDto;
  isHoliday: boolean;
  holidayName: string;
}

export interface AcademicScheduleDto {
  year: number;
  semester: SemesterDto;
  periodType: PeriodTypeDto;
  title: string;
}

export interface ShuttleOperationStatusDto {
  isOperating: boolean;
  periodType: PeriodTypeDto;
  dayType: DayTypeDto;
  noOperationReason: string;
}

export interface AcademicStatusDto {
  date: string;
  calendar: CalendarStatusDto;
  academic: AcademicScheduleDto;
  shuttle: ShuttleOperationStatusDto;
}

export interface AcademicStatusApiDataSource {
  // date 생략 시 백엔드가 한국 시간 기준 오늘로 처리
  getStatus: (date?: string) => Promise<ApiResponse<AcademicStatusDto>>;
}

export const createAcademicStatusApiDataSource = ({ httpClient }: { httpClient: HttpClient }): AcademicStatusApiDataSource => ({
  getStatus: async (date) => {
    const query = date ? `?date=${date}` : '';
    return parseOrThrow(await httpClient.get(`/api/v1/academic/status${query}`));
  },
});
