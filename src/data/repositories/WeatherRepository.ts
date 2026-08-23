// 레포지토리: 날씨 API 응답(DTO)을 Weather 엔티티로 변환
import {
  toWeatherCondition,
  toPmGrade,
  toUvGrade,
  type HourlyForecast,
  type CurrentWeather,
} from '../../domain/entities/Weather.js';
import { toEpoch } from '../../utils/time.js';
import type {
  WeatherApiDataSource,
  HourlyForecastDto,
  CurrentWeatherDto,
} from '../datasources/WeatherApiDataSource.js';
import type { WeatherRepository } from '../../domain/repositories/IWeatherRepository.js';

const toHourly = (dto: HourlyForecastDto): HourlyForecast => ({
  epoch: toEpoch(dto.forecastAt),
  temp: dto.temperature,
  condition: toWeatherCondition(dto.weatherCondition),
  precipProb: dto.precipProbability,
});

const isDrawable = (item: HourlyForecast) =>
  !Number.isNaN(item.epoch) && typeof item.temp === 'number';

const toCurrent = (dto: CurrentWeatherDto): CurrentWeather => ({
  epoch: toEpoch(dto.forecastAt),
  temp: dto.temperature,
  condition: toWeatherCondition(dto.weatherCondition),
  maxTemp: dto.maxTemperature,
  minTemp: dto.minTemperature,
  pm10Grade: toPmGrade(dto.pm10Grade),
  pm25Grade: toPmGrade(dto.pm25Grade),
  uvGrade: toUvGrade(dto.uvIndex),
});

export const createWeatherRepository = (
  { weatherApiDataSource }: { weatherApiDataSource: WeatherApiDataSource }
): WeatherRepository => ({
  getWeather: async () => {
    const res = await weatherApiDataSource.getWeather();
    // success 실패했을때 
    if (!res.success) throw new Error(res.error?.message || 'weather API returned success:false');
   
    const current = res.data?.current;
    // data 중 current가 비어서왔을때 
    if (!current || typeof current.temperature !== 'number') {
      throw new Error('weather API returned invalid shape');
    }

    // data 중 hourly가 비어서왔을때 
    const hourlyRaw = Array.isArray(res.data.hourly) ? res.data.hourly : [];
    const hourly = hourlyRaw
      .map(toHourly)
      .filter(isDrawable)
      .sort((a, b) => a.epoch - b.epoch);

    return { current: toCurrent(current), hourly };
  },
});
