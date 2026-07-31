// 레포지토리: 체대 헬스장 시간표 데이터를 도메인 엔티티로 변환해 제공
import { createGymSchedule } from '../../domain/entities/Gym.js';
import type { GymApiDataSource } from '../datasources/GymApiDataSource.js';
import type { GymRepository } from '../../domain/repositories/IGymRepository.js';

export const createGymRepository = ({ gymApiDataSource }: { gymApiDataSource: GymApiDataSource }): GymRepository => ({
  getSchedule: async () => createGymSchedule(await gymApiDataSource.getSchedule()),
});
