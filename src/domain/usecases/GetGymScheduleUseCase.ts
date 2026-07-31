// 유스케이스: 체대 헬스장 시간표 조회
import type { GymSchedule } from '../entities/Gym.js';
import type { GymRepository } from '../repositories/IGymRepository.js';

export interface GetGymScheduleUseCase {
  execute: () => Promise<GymSchedule>;
}

export const createGetGymScheduleUseCase = (
  { gymRepository }: { gymRepository: GymRepository }
): GetGymScheduleUseCase => ({
  execute: () => gymRepository.getSchedule(),
});
