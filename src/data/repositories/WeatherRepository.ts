// 레포지토리: 날씨 API 응답을 Weather 엔티티로 변환
import { createWeather } from '../../domain/entities/Weather.js';
import type { WeatherApiDataSource } from '../datasources/WeatherApiDataSource.js';
import type { WeatherRepository } from '../../domain/repositories/IWeatherRepository.js';

export const createWeatherRepository = (
  { weatherApiDataSource }: { weatherApiDataSource: WeatherApiDataSource }
): WeatherRepository => ({
  getWeather: async () => {
    const data = await weatherApiDataSource.getWeather();
    return createWeather(data);
  },
});
