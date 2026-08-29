// 유스케이스: 오늘이 법정공휴일인지 조회
import type { HolidayRepository } from '../repositories/IHolidayRepository.js';

export interface GetIsHolidayUseCase {
  execute: () => Promise<boolean>;
}

export const createGetIsHolidayUseCase = (
  { holidayRepository }: { holidayRepository: HolidayRepository }
): GetIsHolidayUseCase => ({
  execute: () => holidayRepository.isTodayHoliday(),
});
