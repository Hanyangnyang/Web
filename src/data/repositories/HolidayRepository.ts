// 레포지토리: 법정공휴일 API 응답을 도메인 boolean으로 변환해 제공 (캐싱은 React Query가 담당)
import type { HolidayApiDataSource } from '../datasources/HolidayApiDataSource.js';
import type { HolidayRepository } from '../../domain/repositories/IHolidayRepository.js';

export const createHolidayRepository = (
  { holidayApiDataSource }: { holidayApiDataSource: HolidayApiDataSource }
): HolidayRepository => ({
  isTodayHoliday: async () => {
    const data = await holidayApiDataSource.getTodayHoliday();
    return !!data?.isHoliday;
  },
});
