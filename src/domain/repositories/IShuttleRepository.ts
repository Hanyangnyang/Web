// 도메인 레포지토리 인터페이스: 셔틀 시간표 제공 계약 (구현은 data 레이어의 ShuttleRepository)
// 지하철 관련 계약은 ISubwayRepository.ts 참고
import type { ShuttleRow } from '../entities/Shuttle.js';

export interface ShuttleRepository {
  getScheduleData: () => Promise<ShuttleRow[]>;
}
