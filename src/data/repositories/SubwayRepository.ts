// 레포지토리: 지하철 전체 시간표(새 백엔드)를 도메인 엔티티로 변환해 제공 (캐싱은 React Query가 담당)
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createSubwayScheduleRow, type SubwayScheduleRow } from '../../domain/entities/Subway.js';
import type { SubwayApiDataSource } from '../datasources/SubwayApiDataSource.js';
import type { SubwayRepository } from '../../domain/repositories/ISubwayRepository.js';
import { SubwayScheduleDataSchema, SubwayTimetableDtoSchema, type SubwayTimetableDto } from '../schemas/SubwaySchema.js';

const AREA = '지하철'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

const SUBWAY_LINE_ID: Record<string, string> = {
  LINE4: '1004',
  SUIN: '1075',
};

const DIRECTION_LABEL: Record<string, string> = {
  UPWARD: '상행',
  DOWNWARD: '하행',
};

const SUBWAY_DAY_TYPE_LABEL: Record<string, string> = {
  WEEKDAY: '평일',
  WEEKEND: '주말',
  HOLIDAY: '주말',
};

// dto는 SubwayTimetableDtoSchema가 이미 원시 타입을 보장한 값 — 여기선 행 단위 변환만 담당
function toSubwayScheduleRows(dtos: SubwayTimetableDto[]) {
  const rows = dtos.map(d => createSubwayScheduleRow({
    subwayId: SUBWAY_LINE_ID[d.subwayLine] ?? d.subwayLine,
    updnLine: DIRECTION_LABEL[d.direction] ?? d.direction,
    dayType: SUBWAY_DAY_TYPE_LABEL[d.dayType] ?? d.dayType,
    arrTime: d.time,
    dest: d.destination,
    trainNo: d.trainNo,
  }));

  return rows.sort((a, b) => a.arrTime.localeCompare(b.arrTime));
}

export const createSubwayRepository = (
  { subwayApiDataSource }: { subwayApiDataSource: SubwayApiDataSource }
): SubwayRepository => ({
  getSubwaySchedule: async () => {
    const res = await subwayApiDataSource.getSchedule();
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `subway schedule API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. data가 배열 형태로 오지 않았을때, Error 반환
    const parsed = SubwayScheduleDataSchema.safeParse(res.data);
    if (!parsed.success)
      throw apiError(
        `subway schedule API returned invalid shaped 'data': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    // 3. 행은 하나가 이상해도(time 형식 이상) 그 행만 제외 — 걸러낸 뒤에도 하나도 안 남으면 Error 반환.
    // 한대앞역 지하철 시간표는 정상 운영 중이면 구조적으로 절대 텅 빌 수 없는 데이터라, 비어있으면
    // 정상 "연결 열차 없음"이 아니라 진짜 실패로 취급한다.
    const dtos = parsed.data
      .map(d => SubwayTimetableDtoSchema.safeParse(d))
      .filter(r => r.success)
      .map(r => r.data);

    const rows = toSubwayScheduleRows(dtos);
    if (rows.length === 0)
      throw apiError('subway schedule API returned no valid rows', { area: AREA, endpoint: res._requestUrl });

    return rows;
  },
});
