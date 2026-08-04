// 유스케이스: 셔틀 시간표 원본 데이터 조회 (최초 1회 로드)
import type { ShuttleRow } from '../entities/Shuttle.js';
import type { ShuttleRepository } from '../repositories/IShuttleRepository.js';

export interface GetShuttleDataUseCase {
  execute: () => Promise<ShuttleRow[]>;
}

export const createGetShuttleDataUseCase = (
  { shuttleRepository }: { shuttleRepository: ShuttleRepository }
): GetShuttleDataUseCase => ({
  execute: () => shuttleRepository.getScheduleData(),
});
