// 레포지토리: 셔틀 시간표 및 지하철 도착 데이터 제공 (캐싱은 React Query가 담당)
import type { ShuttleDataSource, ShuttleScheduleRow, SubwayArrivalApiItem } from '../datasources/ShuttleDataSource.js';

export interface SubwayArrivals {
  arrivals: SubwayArrivalApiItem[];
  offPeak: boolean;
  isHoliday: boolean;
}

export interface ShuttleRepository {
  getScheduleData: () => Promise<ShuttleScheduleRow[]>;
  getSubwayArrivals: (full?: boolean, dayType?: string | null) => Promise<SubwayArrivals>;
}

export const createShuttleRepository = ({ shuttleDataSource }: { shuttleDataSource: ShuttleDataSource }): ShuttleRepository => ({
  getScheduleData: () => shuttleDataSource.fetchScheduleData(),

  getSubwayArrivals: async (full = false, dayType = null) => {
    const data = await shuttleDataSource.fetchSubwayArrivals(full, dayType);
    return { arrivals: data.arrivals ?? [], offPeak: !!data.offPeak, isHoliday: data.isHoliday ?? false };
  },
});
