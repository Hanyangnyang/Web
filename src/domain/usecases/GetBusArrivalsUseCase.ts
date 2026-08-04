// 유스케이스: 정류소별 일반버스 도착정보 조회
import type { BusArrival } from '../entities/PublicBus.js';
import type { BusRepository } from '../repositories/IBusRepository.js';

export interface GetBusArrivalsUseCase {
  execute: (stopName: string) => Promise<BusArrival[]>;
}

export const createGetBusArrivalsUseCase = (
  { busRepository }: { busRepository: BusRepository }
): GetBusArrivalsUseCase => ({
  execute: (stopName: string) => busRepository.getArrivals(stopName),
});
