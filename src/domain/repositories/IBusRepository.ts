// 도메인 레포지토리 인터페이스: 일반버스 도착정보 제공 계약 (구현은 data 레이어의 BusRepository)
import type { BusArrival } from '../entities/PublicBus.js';

export interface BusRepository {
  getArrivals: (stopName: string) => Promise<BusArrival[]>;
}
