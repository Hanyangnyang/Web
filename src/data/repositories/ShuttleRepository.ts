// 레포지토리: 셔틀 시간표 및 지하철 도착 데이터를 도메인 엔티티로 변환해 제공 (캐싱은 React Query가 담당)
import { createShuttleRow, createSubwayArrival } from '../../domain/entities/Shuttle.js';
import type { ShuttleDataSource } from '../datasources/ShuttleDataSource.js';
import type { ShuttleRepository } from '../../domain/repositories/IShuttleRepository.js';

export const createShuttleRepository = ({ shuttleDataSource }: { shuttleDataSource: ShuttleDataSource }): ShuttleRepository => ({
  getScheduleData: async () => {
    const rows = await shuttleDataSource.fetchScheduleData();
    return rows.map(createShuttleRow);
  },

  getSubwayArrivals: async (full = false, dayType = null) => {
    const data = await shuttleDataSource.fetchSubwayArrivals(full, dayType);
    return {
      arrivals: (data.arrivals ?? []).map(createSubwayArrival),
      offPeak: !!data.offPeak,
      isHoliday: data.isHoliday ?? false,
    };
  },
});
