// 레포지토리: AI 날씨 브리핑 API 응답을 WeatherBriefing 엔티티로 변환
import { createWeatherBriefing } from '../../domain/entities/WeatherBriefing.js';
import type { WeatherBriefingApiDataSource } from '../datasources/WeatherBriefingApiDataSource.js';
import type { WeatherBriefingRepository } from '../../domain/repositories/IWeatherBriefingRepository.js';

export const createWeatherBriefingRepository = (
  { weatherBriefingApiDataSource }: { weatherBriefingApiDataSource: WeatherBriefingApiDataSource }
): WeatherBriefingRepository => ({
  getBriefing: async (options = {}) => {
    const res = await weatherBriefingApiDataSource.getBriefing(options);
    if (!res.success) throw new Error(res.error?.message || 'weather briefing API returned success:false');
    if (!res.data) return null;

    const briefing = createWeatherBriefing(res.data);
    return briefing.content ? briefing : null;
  },
});
