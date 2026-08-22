// 유스케이스: 지하철 전체 시간표 원본 데이터 조회 (새 백엔드, 최초 1회 로드)
import type { SubwayScheduleRow } from '../entities/Shuttle.js';
import type { SubwayRepository } from '../repositories/ISubwayRepository.js';

export interface GetSubwayScheduleUseCase {
  execute: () => Promise<SubwayScheduleRow[]>;
}

export const createGetSubwayScheduleUseCase = (
  { subwayRepository }: { subwayRepository: SubwayRepository }
): GetSubwayScheduleUseCase => ({
  execute: () => subwayRepository.getSubwaySchedule(),
});
