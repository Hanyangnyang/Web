// 레포지토리: 체대 헬스장 시간표(새 백엔드)를 도메인 엔티티로 변환해 제공
import type { GymSchedule, GymPeriod } from '../../domain/entities/Gym.js';
import type { GymApiDataSource, GymPeriodDto } from '../datasources/GymApiDataSource.js';
import type { GymRepository } from '../../domain/repositories/IGymRepository.js';

const GYM_LOCATION = '예체능대학 1층'; // API가 안 주는 고정값 — 거의 안 바뀌는 물리적 위치라 프론트 상수로 유지

const PERIOD_TYPE_LABEL: Record<GymPeriodDto['periodType'], GymPeriod['periodType']> = {
  SEMESTER: 'semester',
  SEASONAL: 'seasonal',
  VACATION: 'vacation',
};

const TIME_PATTERN = /^\d{2}:\d{2}/; // "HH:mm:ss..." — 최소 시:분만 있으면 허용 (Shuttle/Subway와 동일 패턴)

function toHHMM(time: string): string {
  return typeof time === 'string' && TIME_PATTERN.test(time) ? time.slice(0, 5) : '';
}

function toGymPeriod(dto: GymPeriodDto): GymPeriod {
  const schedules = Array.isArray(dto.schedules) ? dto.schedules : [];
  return {
    id: String(dto.id),
    periodType: PERIOD_TYPE_LABEL[dto.periodType] ?? 'semester',
    title: String(dto.title ?? ''), 
    startDate: String(dto.start_date ?? ''),
    endDate: String(dto.end_date ?? ''),
    openTime: toHHMM(dto.start_time),
    closeTime: toHHMM(dto.end_time),
    classes: schedules
      .filter(s => TIME_PATTERN.test(s.startTime) && TIME_PATTERN.test(s.endTime))
      .map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: toHHMM(s.startTime),
        endTime: toHHMM(s.endTime),
        classId: s.classId,
        className: s.className,
      })),
  };
}

export const createGymRepository = (
  { gymApiDataSource }: { gymApiDataSource: GymApiDataSource }
): GymRepository => ({
  getSchedule: async (): Promise<GymSchedule> => {
    const res = await gymApiDataSource.getSchedule();
    // success 실패했을때
    if (!res.success) throw new Error(res.error?.message || 'gym schedule API request failed');
    // data 비어서왔을때
    if (!Array.isArray(res.data)) throw new Error('gym schedule API returned invalid shape');

    return { location: GYM_LOCATION, periods: res.data.map(toGymPeriod) };
  },
});
