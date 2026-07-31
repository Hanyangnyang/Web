// 유스케이스: 한대앞역 실시간 지하철 도착 정보 조회
import type { ShuttleRepository, SubwayArrivals } from '../repositories/IShuttleRepository.js';

export interface GetSubwayArrivalsUseCase {
  execute: (full?: boolean, dayType?: string | null) => Promise<SubwayArrivals>;
}

export const createGetSubwayArrivalsUseCase = (
  { shuttleRepository }: { shuttleRepository: ShuttleRepository }
): GetSubwayArrivalsUseCase => ({
  execute: (full = false, dayType = null) => shuttleRepository.getSubwayArrivals(full, dayType),
});
