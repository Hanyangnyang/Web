// 레포지토리: AI 날씨 브리핑 API 응답을 WeatherBriefing 엔티티로 변환
import type { WeatherBriefingApiDataSource } from '../datasources/WeatherBriefingApiDataSource.js';
import type { WeatherBriefingRepository } from '../../domain/repositories/IWeatherBriefingRepository.js';

export const createWeatherBriefingRepository = (
  { weatherBriefingApiDataSource }: { weatherBriefingApiDataSource: WeatherBriefingApiDataSource }
): WeatherBriefingRepository => ({
  getBriefing: async (options = {}) => {
    const res = await weatherBriefingApiDataSource.getBriefing(options);
    // success 실패했을때 
    if (!res.success) throw new Error(res.error?.message || 'weather briefing API returned success:false');

    // data 비어서왔을때 
    const content = res.data?.content?.trim();
    if (!content) return null;

    return { content };
  },
});
