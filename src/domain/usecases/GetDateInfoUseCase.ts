// 유스케이스: 특정 날짜의 평일/주말/공휴일/미운행 상태 조회
import type { DateInfo } from '../entities/DateInfo.js';
import type { DateInfoRepository, GetDateInfoParams } from '../repositories/IDateInfoRepository.js';

export interface GetDateInfoUseCase {
  execute: (params?: GetDateInfoParams) => Promise<DateInfo>;
}

export const createGetDateInfoUseCase = (
  { dateInfoRepository }: { dateInfoRepository: DateInfoRepository }
): GetDateInfoUseCase => ({
  execute: (params) => dateInfoRepository.getDateInfo(params),
});
