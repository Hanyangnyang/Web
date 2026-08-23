// 레포지토리: 지하철 전체 시간표(새 백엔드)를 도메인 엔티티로 변환해 제공 (캐싱은 React Query가 담당)
import { createSubwayScheduleRow, type SubwayScheduleRow } from '../../domain/entities/Subway.js';
import type { SubwayApiDataSource, SubwayTimetableDto } from '../datasources/SubwayApiDataSource.js';
import type { SubwayRepository } from '../../domain/repositories/ISubwayRepository.js';

const TIME_PATTERN = /^\d{2}:\d{2}/; // "HH:mm..." — 최소 시:분만 있으면 허용

const SUBWAY_LINE_ID: Record<SubwayTimetableDto['subwayLine'], string> = {
  LINE4: '1004',
  SUIN: '1075',
};

const DIRECTION_LABEL: Record<SubwayTimetableDto['direction'], string> = {
  UPWARD: '상행',
  DOWNWARD: '하행',
};

const SUBWAY_DAY_TYPE_LABEL: Record<SubwayTimetableDto['dayType'], string> = {
  WEEKDAY: '평일',
  WEEKEND: '주말',
  HOLIDAY: '주말',
};

// dtos가 배열임은 호출부(getSubwaySchedule)가 이미 검증했다는 전제 — 여기선 행 단위 변환만 담당
function toSubwayScheduleRows(dtos: SubwayTimetableDto[]) {
  const rows = dtos.reduce<SubwayScheduleRow[]>((acc, d) => {
    if (typeof d.time !== 'string' || !TIME_PATTERN.test(d.time)) return acc;

    acc.push(createSubwayScheduleRow({
      subwayId: SUBWAY_LINE_ID[d.subwayLine] ?? d.subwayLine,
      updnLine: DIRECTION_LABEL[d.direction] ?? d.direction,
      dayType: SUBWAY_DAY_TYPE_LABEL[d.dayType] ?? d.dayType,
      arrTime: d.time.slice(0, 5), // "HH:mm:ss" → "HH:mm"
      dest: d.destination,
      trainNo: d.trainNo,
    }));
    return acc;
  }, []);

  return rows.sort((a, b) => a.arrTime.localeCompare(b.arrTime));
}

export const createSubwayRepository = (
  { subwayApiDataSource }: { subwayApiDataSource: SubwayApiDataSource }
): SubwayRepository => ({
  getSubwaySchedule: async () => {
    const res = await subwayApiDataSource.getSchedule();
    // success 실패했을때 
    if (!res.success) throw new Error(res.error?.message || 'subway schedule API request failed');
    // data 비어서왔을때 
    if (!Array.isArray(res.data)) throw new Error('subway schedule API returned invalid shape');

    return toSubwayScheduleRows(res.data);
  },
});
