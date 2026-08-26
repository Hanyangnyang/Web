// 레포지토리: 체대 헬스장 시간표(새 백엔드)를 도메인 엔티티로 변환해 제공
import { apiError } from '../../infrastructure/http/HttpClient.js';
import type { GymSchedule, GymPeriod } from '../../domain/entities/Gym.js';
import type { GymApiDataSource } from '../datasources/GymApiDataSource.js';
import type { GymRepository } from '../../domain/repositories/IGymRepository.js';
import { GymScheduleDataSchema, GymClassSessionDtoSchema, type GymPeriodDto } from '../schemas/GymSchema.js';

const GYM_LOCATION = '예체능대학 1층'; // API가 안 주는 고정값 — 거의 안 바뀌는 물리적 위치라 프론트 상수로 유지
const AREA = '체대헬스장 시간표'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

const PERIOD_TYPE_LABEL: Record<GymPeriodDto['periodType'], GymPeriod['periodType']> = {
  SEMESTER: 'semester',
  SEASONAL: 'seasonal',
  VACATION: 'vacation',
};

// dto는 GymPeriodDtoSchema가 이미 검증·정규화(HH:mm 변환, enum catch)한 값이라 여기선 필드 옮겨담기만 한다.
// schedules 배열은 개별 항목이 이상해도 이 기간 전체를 못 쓰게 만들지 않도록, 항목별로 개별 parse해서
// 실패한 항목만 걸러낸다 (GymPeriodDtoSchema 안에 중첩시키면 항목 하나 실패로 배열 전체가 실패하게 됨)
function toGymPeriod(dto: GymPeriodDto): GymPeriod {
  const classes = dto.schedules
    .map(s => GymClassSessionDtoSchema.safeParse(s))
    .filter(r => r.success)
    .map(r => r.data);

  return {
    id: dto.id,
    periodType: PERIOD_TYPE_LABEL[dto.periodType],
    title: dto.title,
    startDate: dto.start_date,
    endDate: dto.end_date,
    openTime: dto.start_time,
    closeTime: dto.end_time,
    classes,
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

    // 2. data shape이 스키마와 안 맞을때, 필드별 사유를 담아 Error 반환
    const parsed = GymScheduleDataSchema.safeParse(res.data);
    if (!parsed.success)
      throw apiError(
        `gym schedule API returned invalid shaped 'data': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    // 3. 최소 필요한 정보의 단위가 하나도 없을때, Error 반환
    const periods = parsed.data.map(toGymPeriod);
    if (periods.length === 0)
      throw apiError('gym schedule API returned no periods', { area: AREA, endpoint: res._requestUrl });

    return { location: GYM_LOCATION, periods };
  },
});
