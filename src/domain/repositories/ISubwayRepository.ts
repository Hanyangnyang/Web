// 도메인 레포지토리 인터페이스: 지하철 전체 시간표 제공 계약 (구현은 data 레이어의 SubwayRepository)
import type { SubwayScheduleRow } from '../entities/Shuttle.js';

export interface SubwayRepository {
  getSubwaySchedule: () => Promise<SubwayScheduleRow[]>;
}
