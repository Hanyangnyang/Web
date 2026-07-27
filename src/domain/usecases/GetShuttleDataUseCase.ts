// 유스케이스: 셔틀 시간표 원본 데이터 조회 (최초 1회 로드)
import type { ShuttleScheduleRow } from '../../data/datasources/ShuttleDataSource.js';
import type { ShuttleRepository } from '../../data/repositories/ShuttleRepository.js';

export interface GetShuttleDataUseCase {
  execute: () => Promise<ShuttleScheduleRow[]>;
}

export const createGetShuttleDataUseCase = (
  { shuttleRepository }: { shuttleRepository: ShuttleRepository }
): GetShuttleDataUseCase => ({
  execute: () => shuttleRepository.getScheduleData(),
});
