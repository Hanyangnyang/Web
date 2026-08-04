// 도메인 레포지토리 인터페이스: 체대 헬스장 시간표 제공 계약 (구현은 data 레이어의 GymRepository)
import type { GymSchedule } from '../entities/Gym.js';

export interface GymRepository {
  getSchedule: () => Promise<GymSchedule>;
}
