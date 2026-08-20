// 레포지토리: 셔틀 시간표(새 백엔드) 및 지하철 도착 데이터를 도메인 엔티티로 변환해 제공 (캐싱은 React Query가 담당)
import { createShuttleRow, createSubwayArrival, type ShuttleRow } from '../../domain/entities/Shuttle.js';
import type { ShuttleApiDataSource, ShuttleTimetableDto } from '../datasources/ShuttleApiDataSource.js';
import type { ShuttleDataSource } from '../datasources/ShuttleDataSource.js';
import type { ShuttleRepository } from '../../domain/repositories/IShuttleRepository.js';

const ROUTE_LABEL: Record<ShuttleTimetableDto['route'], string> = {
  MORNING_DIR: '아침직행',
  DIR: '직행',
  CIRCULAR: '순환',
  MORNING_ART: '아침예술인',
  ART: '예술인직행',
  CENTRAL: '중앙역',
};

const PERIOD_LABEL: Record<ShuttleTimetableDto['period'], string> = {
  SEMESTER: '학기중',
  SEASONAL: '계절학기',
  VACATION: '방학중',
};

const DAY_TYPE_LABEL: Record<ShuttleTimetableDto['dayType'], string> = {
  WEEKDAY: '평일',
  HOLIDAY: '주말',
};

const TIME_PATTERN = /^\d{2}:\d{2}/; // "HH:mm..." — 최소 시:분만 있으면 허용

// 행 하나가 이상한 형태여도(예: departureTime 누락) 그 행만 건너뛰고 나머지 시간표는 살린다 —
// 여기서 throw하면 학식 MenuRepository와 달리 그날 시간표 전체가 통째로 에러 처리된다
function toShuttleRows(dtos: ShuttleTimetableDto[]) {
  if (!Array.isArray(dtos)) throw new Error('shuttle API returned invalid shape');

  return dtos.reduce<ShuttleRow[]>((rows, d) => {
    if (typeof d.departureTime !== 'string' || !TIME_PATTERN.test(d.departureTime)) return rows;

    rows.push(createShuttleRow({
      route: ROUTE_LABEL[d.route] ?? d.route,
      period: PERIOD_LABEL[d.period] ?? d.period,
      dayType: DAY_TYPE_LABEL[d.dayType] ?? d.dayType,
      dep: d.departureTime.slice(0, 5), // "HH:mm:ss" → "HH:mm"
    }));
    return rows;
  }, []);
}

export const createShuttleRepository = (
  { shuttleApiDataSource, shuttleDataSource }: { shuttleApiDataSource: ShuttleApiDataSource; shuttleDataSource: ShuttleDataSource }
): ShuttleRepository => ({
  getScheduleData: async () => {
    const res = await shuttleApiDataSource.getSchedule();
    if (!res.success) throw new Error(res.error?.message || 'shuttle API request failed');

    return toShuttleRows(res.data ?? []);
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
