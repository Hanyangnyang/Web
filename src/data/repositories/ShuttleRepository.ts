// 레포지토리: 셔틀 시간표(새 백엔드)를 도메인 엔티티로 변환해 제공 (캐싱은 React Query가 담당)
// 지하철 관련 데이터는 SubwayRepository.ts 참고
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createShuttleRow, type ShuttleRow } from '../../domain/entities/Shuttle.js';
import type { ShuttleApiDataSource } from '../datasources/ShuttleApiDataSource.js';
import type { ShuttleRepository } from '../../domain/repositories/IShuttleRepository.js';
import { ShuttleScheduleDataSchema, ShuttleTimetableDtoSchema, type ShuttleTimetableDto } from '../schemas/ShuttleSchema.js';

const AREA = '셔틀 시간표'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

const ROUTE_LABEL: Record<string, string> = {
  MORNING_DIR: '아침직행',
  DIR: '직행',
  CIRCULAR: '순환',
  MORNING_ART: '아침예술인',
  ART: '예술인직행',
  CENTRAL: '중앙역',
};

const PERIOD_LABEL: Record<string, string> = {
  SEMESTER: '학기중',
  SEASONAL: '계절학기',
  VACATION: '방학중',
};

const DAY_TYPE_LABEL: Record<string, string> = {
  WEEKDAY: '평일',
  HOLIDAY: '주말',
};

// dto는 ShuttleTimetableDtoSchema가 이미 원시 타입을 보장한 값. route/period/dayType이
// 모르는 값이면 throw 대신 원본 값 그대로 통과시킨다 (라벨 매핑 실패 = 새로 추가된 값일 뿐, 에러 아님)
function toShuttleRows(dtos: ShuttleTimetableDto[]): ShuttleRow[] {
  return dtos.map(d => createShuttleRow({
    route: ROUTE_LABEL[d.route] ?? d.route,
    period: PERIOD_LABEL[d.period] ?? d.period,
    dayType: DAY_TYPE_LABEL[d.dayType] ?? d.dayType,
    dep: d.departureTime,
  }));
}

export const createShuttleRepository = (
  { shuttleApiDataSource }: { shuttleApiDataSource: ShuttleApiDataSource }
): ShuttleRepository => ({
  getScheduleData: async () => {
    const res = await shuttleApiDataSource.getSchedule();
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `shuttle API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. data가 배열 형태로 오지 않았을때, Error 반환
    const parsed = ShuttleScheduleDataSchema.safeParse(res.data);
    if (!parsed.success)
      throw apiError(
        `shuttle API returned invalid shaped 'data': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    // 3. 행은 하나가 이상해도(departureTime 형식 이상) 그 행만 제외 — 걸러낸 뒤에도 하나도
    // 안 남으면 Error 반환. 셔틀 시간표는 정상 운영 중이면 구조적으로 절대 텅 빌 수 없는 데이터라,
    // 비어있으면 정상 "오늘 남은 셔틀이 없음"이 아니라 진짜 실패로 취급한다.
    const dtos = parsed.data
      .map(d => ShuttleTimetableDtoSchema.safeParse(d))
      .filter(r => r.success)
      .map(r => r.data);

    const rows = toShuttleRows(dtos);
    if (rows.length === 0)
      throw apiError('shuttle API returned no valid rows', { area: AREA, endpoint: res._requestUrl });

    return rows;
  },
});
