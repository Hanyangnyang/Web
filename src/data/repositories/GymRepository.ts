// 레포지토리: 체대 헬스장 시간표 데이터 제공
import type { GymApiDataSource, GymScheduleApiResponse } from '../datasources/GymApiDataSource.js';

export interface GymRepository {
  getSchedule: () => Promise<GymScheduleApiResponse>;
}

export const createGymRepository = ({ gymApiDataSource }: { gymApiDataSource: GymApiDataSource }): GymRepository => ({
  getSchedule: () => gymApiDataSource.getSchedule(),
});
