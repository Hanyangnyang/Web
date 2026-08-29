// 레포지토리: AI 날씨 브리핑 API 응답을 WeatherBriefing 엔티티로 변환
import { apiError } from '../../infrastructure/http/HttpClient.js';
import type { WeatherBriefingApiDataSource } from '../datasources/WeatherBriefingApiDataSource.js';
import type { WeatherBriefingRepository } from '../../domain/repositories/IWeatherBriefingRepository.js';

const AREA = '날씨 브리핑'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

export const createWeatherBriefingRepository = (
  { weatherBriefingApiDataSource }: { weatherBriefingApiDataSource: WeatherBriefingApiDataSource }
): WeatherBriefingRepository => ({
  getBriefing: async (options = {}) => {
    const res = await weatherBriefingApiDataSource.getBriefing(options);
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `weather briefing API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. content가 비어있을때 — 에러로 취급 안 함. AI 브리핑은 매시 22분에 갱신되는 부가 콘텐츠라
    // 갱신 직후 잠깐 비어있거나 생성 실패해도 날씨 자체엔 문제없는 정상적인 상태 
    const content = res.data?.content?.trim();
    if (!content) return null;

    return { content };
  },
});
