// 데이터 소스: 법정공휴일 여부 조회(/api/holidays, 구 Vercel BFF) 원시 호출
import type { HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface HolidayDto {
  date: string; // 'YYYY-MM-DD'
  isHoliday: boolean;
}

export interface HolidayApiDataSource {
  getTodayHoliday: () => Promise<HolidayDto>;
}

export const createHolidayApiDataSource = ({ httpClient }: { httpClient: HttpClient }): HolidayApiDataSource => ({
  getTodayHoliday: async () => {
    const res = await httpClient.get('/api/holidays');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
});
