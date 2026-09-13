// 데이터 소스: 특정 날짜의 평일/주말/공휴일/미운행 상태 새 백엔드(/api/v1/holidays/date-info) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export type DayOfWeekDto = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type DayTypeDto = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'NO_OPERATION';

export interface DateInfoDto {
  date: string;
  dayOfWeek: DayOfWeekDto;
  dayType: DayTypeDto;
  name: string;
}

export interface DateInfoApiDataSource {
  // date 생략 시 백엔드가 한국 시간 기준 오늘로 처리
  getDateInfo: (date?: string) => Promise<ApiResponse<DateInfoDto>>;
}

export const createDateInfoApiDataSource = ({ httpClient }: { httpClient: HttpClient }): DateInfoApiDataSource => ({
  getDateInfo: async (date) => {
    const query = date ? `?date=${date}` : '';
    return parseOrThrow(await httpClient.get(`/api/v1/holidays/date-info${query}`));
  },
});
