// 유스케이스: 체대 헬스장 시간표 조회
import type { GymScheduleApiResponse } from '../../data/datasources/GymApiDataSource.js';
import type { GymRepository } from '../../data/repositories/GymRepository.js';

export interface GetGymScheduleUseCase {
  execute: () => Promise<GymScheduleApiResponse>;
}

export const createGetGymScheduleUseCase = (
  { gymRepository }: { gymRepository: GymRepository }
): GetGymScheduleUseCase => ({
  execute: () => gymRepository.getSchedule(),
});
