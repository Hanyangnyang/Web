// 레포지토리: 체대 헬스장 시간표(새 백엔드)를 도메인 엔티티로 변환해 제공
import { apiError } from '../../infrastructure/http/HttpClient.js';
import type { GymSchedule, GymPeriod } from '../../domain/entities/Gym.js';
import type { GymApiDataSource, GymPeriodDto } from '../datasources/GymApiDataSource.js';
import type { GymRepository } from '../../domain/repositories/IGymRepository.js';

const GYM_LOCATION = '예체능대학 1층'; // API가 안 주는 고정값 — 거의 안 바뀌는 물리적 위치라 프론트 상수로 유지
const AREA = '체대 헬스장 시간표'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

const PERIOD_TYPE_LABEL: Record<GymPeriodDto['periodType'], GymPeriod['periodType']> = {
  SEMESTER: 'semester',
  SEASONAL: 'seasonal',
  VACATION: 'vacation',
};

const TIME_PATTERN = /^\d{2}:\d{2}/; // "HH:mm:ss..." — 최소 시:분만 있으면 허용 
function toHHMM(time: string): string {
  return typeof time === 'string' && TIME_PATTERN.test(time) ? time.slice(0, 5) : '';
}

// 타입이 실제로 지켜졌는가에 대한 방어 로직 - 배열, enum 값, HH:mm 형식 
// dto 타입은 컴파일 타임 약속일 뿐, 런타임에 실제로 지켜진다는 보장이 없다 — 개별 필드 하나가
// 이상해도(배열 아님/모르는 enum 값/형식 안 맞는 시간) 이 기간 전체를 못 쓰게 만들지 않고
// 그 필드만 기본값으로 대체한다. 
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
    // 1. success 실패했을때, Error 반환
    if (!res.success) 
      throw apiError(res.error?.message || 'gym schedule API request failed', { area: AREA, endpoint: res._requestUrl });

    // 2. data가 배열 형태로 오지 않았을때, Error 반환
    if (!Array.isArray(res.data)) 
      throw apiError(`gym schedule API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    // 3. 최소 필요한 정보의 단위가 하나도 없을때, Error 반환
    const periods = res.data.map(toGymPeriod);
    if (periods.length === 0) 
      throw apiError('gym schedule API returned no periods', { area: AREA, endpoint: res._requestUrl });

    return { location: GYM_LOCATION, periods };
  },
});
