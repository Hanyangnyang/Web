// 레포지토리: 날씨 API 응답(DTO)을 Weather 엔티티로 변환
import { apiError } from '../../infrastructure/http/HttpClient.js';
import {
  toWeatherCondition,
  toPmGrade,
  toUvGrade,
  type HourlyForecast,
  type CurrentWeather,
} from '../../domain/entities/Weather.js';
import { toEpoch } from '../../utils/time.js';
import type { WeatherApiDataSource } from '../datasources/WeatherApiDataSource.js';
import type { WeatherRepository } from '../../domain/repositories/IWeatherRepository.js';
import {
  WeatherResponseDataSchema,
  HourlyForecastDtoSchema,
  type HourlyForecastDto,
  type CurrentWeatherDto,
} from '../schemas/WeatherSchema.js';

const AREA = '날씨'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

// 시간별 예보 DTO → 엔티티 변환. dto는 HourlyForecastDtoSchema가 이미 원시 타입을 보장한 값
const toHourly = (dto: HourlyForecastDto): HourlyForecast => ({
  epoch: toEpoch(dto.forecastAt),
  temp: dto.temperature,
  condition: toWeatherCondition(dto.weatherCondition),
  precipProb: dto.precipProbability,
});

// toHourly가 만든 항목 중 epoch가 NaN이면(forecastAt 형식이 이상해서) 그 시간 한 칸만 제외
const isDrawable = (item: HourlyForecast) => !Number.isNaN(item.epoch);

// 현재 날씨 DTO → 엔티티 변환. dto는 CurrentWeatherDtoSchema가 이미 원시 타입을 보장한 값
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
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `weather API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. data shape이 스키마와 안 맞을때(특히 current.temperature 누락/타입 이상), 필드별 사유를 담아 Error 반환
    const parsed = WeatherResponseDataSchema.safeParse(res.data);
    if (!parsed.success)
      throw apiError(
        `weather API returned invalid shaped 'data': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    // 3. hourly 배열은 항목 하나가 이상해도 전체를 못 쓰게 만들지 않도록, 항목별로 개별 parse해서
    // 실패한 항목만 걸러낸다 (WeatherResponseDataSchema 안에 중첩시키면 항목 하나 실패로 배열 전체가 실패하게 됨)
    const hourly = parsed.data.hourly
      .map(s => HourlyForecastDtoSchema.safeParse(s))
      .filter(r => r.success)
      .map(r => r.data)
      .map(toHourly)
      .filter(isDrawable)
      .sort((a, b) => a.epoch - b.epoch);

    return { current: toCurrent(parsed.data.current), hourly };
  },
});
