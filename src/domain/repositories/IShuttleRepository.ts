// 도메인 레포지토리 인터페이스: 셔틀 시간표·지하철 도착정보 제공 계약 (구현은 data 레이어의 ShuttleRepository)
import type { ShuttleRow, SubwayArrival } from '../entities/Shuttle.js';

export interface SubwayArrivals {
  arrivals: SubwayArrival[];
  offPeak: boolean;
  isHoliday: boolean;
}

export interface ShuttleRepository {
  getScheduleData: () => Promise<ShuttleRow[]>;
  getSubwayArrivals: (full?: boolean, dayType?: string | null) => Promise<SubwayArrivals>;
}
