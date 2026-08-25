// 레포지토리: 셔틀 시간표(새 백엔드)를 도메인 엔티티로 변환해 제공 (캐싱은 React Query가 담당)
// 지하철 관련 데이터는 SubwayRepository.ts 참고
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createShuttleRow, type ShuttleRow } from '../../domain/entities/Shuttle.js';
import type { ShuttleApiDataSource, ShuttleTimetableDto } from '../datasources/ShuttleApiDataSource.js';
import type { ShuttleRepository } from '../../domain/repositories/IShuttleRepository.js';

const AREA = '셔틀 시간표'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

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

// 필드 방어 로직 — dto 타입은 컴파일 타임 약속일 뿐이라, departureTime 형식이 안 맞는 행은 통째로 제외하고
// route/period/dayType이 모르는 값이면 throw 대신 원본 값 그대로 통과시킨다
function toShuttleRows(dtos: ShuttleTimetableDto[]) {
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
  { shuttleApiDataSource }: { shuttleApiDataSource: ShuttleApiDataSource }
): ShuttleRepository => ({
  getScheduleData: async () => {
    const res = await shuttleApiDataSource.getSchedule();
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `shuttle API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. data가 배열 형태로 오지 않았을때, Error 반환
    if (!Array.isArray(res.data))
      throw apiError(`shuttle API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    const rows = toShuttleRows(res.data);
    // 3. 전체 시간표에 유효한 행이 하나도 없을때, Error 반환 — 셔틀 시간표는 정상 운영 중이면 구조적으로
    // 절대 텅 빌 수 없는 데이터라, 비어있으면 정상 "오늘 남은 셔틀이 없음"이 아니라 진짜 실패로 취급한다.
    if (rows.length === 0)
      throw apiError('shuttle API returned no valid rows', { area: AREA, endpoint: res._requestUrl });

    return rows;
  },
});
