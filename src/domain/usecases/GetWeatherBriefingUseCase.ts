// 유스케이스: 소식탭 AI 날씨 브리핑 조회
import type { WeatherBriefing } from '../entities/WeatherBriefing.js';
import type { WeatherBriefingRepository, GetWeatherBriefingOptions } from '../repositories/IWeatherBriefingRepository.js';

export interface GetWeatherBriefingUseCase {
  execute: (options?: GetWeatherBriefingOptions) => Promise<WeatherBriefing | null>;
}

export const createGetWeatherBriefingUseCase = (
  { weatherBriefingRepository }: { weatherBriefingRepository: WeatherBriefingRepository }
): GetWeatherBriefingUseCase => ({
  execute: (options) => weatherBriefingRepository.getBriefing(options),
});
