// 유스케이스: 소식탭 날씨 정보 조회
import type { Weather } from '../entities/Weather.js';
import type { WeatherRepository } from '../repositories/IWeatherRepository.js';

export interface GetWeatherUseCase {
  execute: () => Promise<Weather>;
}

export const createGetWeatherUseCase = (
  { weatherRepository }: { weatherRepository: WeatherRepository }
): GetWeatherUseCase => ({
  execute: () => weatherRepository.getWeather(),
});
