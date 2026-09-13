// 레포지토리: 특정 날짜의 평일/주말/공휴일/미운행 상태 API 응답을 도메인 엔티티로 변환해 제공
import { apiError, withAreaTag } from '../../infrastructure/http/HttpClient.js';
import { createDateInfo } from '../../domain/entities/DateInfo.js';
import type { DateInfoApiDataSource } from '../datasources/DateInfoApiDataSource.js';
import type { DateInfoRepository } from '../../domain/repositories/IDateInfoRepository.js';

const AREA = '날짜 정보'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

export const createDateInfoRepository = (
  { dateInfoApiDataSource }: { dateInfoApiDataSource: DateInfoApiDataSource }
): DateInfoRepository => ({
  getDateInfo: (params) => withAreaTag(AREA, async () => {
    const res = await dateInfoApiDataSource.getDateInfo(params?.date);

    if (!res.success)
      throw apiError(res.error?.message || `date-info API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data?.date || !res.data.dayOfWeek || !res.data.dayType)
      throw apiError(`date-info API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return createDateInfo(res.data);
  }),
});
