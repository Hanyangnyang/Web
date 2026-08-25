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
import type {
  WeatherApiDataSource,
  HourlyForecastDto,
  CurrentWeatherDto,
} from '../datasources/WeatherApiDataSource.js';
import type { WeatherRepository } from '../../domain/repositories/IWeatherRepository.js';

const AREA = '날씨'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

// 숫자가 아니면 null로 
const toNumberOrNull = (value: unknown): number | null => typeof value === 'number' ? value : null;

// 시간별 예보 DTO → 엔티티 변환. 여기선 개별 필드를 안 막고 그대로 옮기고,
// 실제 방어(이상한 항목 제외)는 아래 isDrawable이 매핑 이후에 담당한다
const toHourly = (dto: HourlyForecastDto): HourlyForecast => ({
  epoch: toEpoch(dto.forecastAt),      
  temp: dto.temperature,              
  condition: toWeatherCondition(dto.weatherCondition), 
  precipProb: dto.precipProbability,   
});

// toHourly가 만든 항목 중 epoch가 NaN이거나 temp가 숫자가 아니면(그릴 수 없음) 그 시간 한 칸만 제외
const isDrawable = (item: HourlyForecast) => !Number.isNaN(item.epoch) && typeof item.temp === 'number';

// 현재 날씨 DTO → 엔티티 변환. temperature는 getWeather의 2번 분기에서 이미 숫자임이 검증된 뒤라 그대로 쓰고,
// 나머지 필드는 각자 방어한다
const toCurrent = (dto: CurrentWeatherDto): CurrentWeather => ({
  epoch: toEpoch(dto.forecastAt),      
  temp: dto.temperature,               
  condition: toWeatherCondition(dto.weatherCondition), 
  maxTemp: toNumberOrNull(dto.maxTemperature),
  minTemp: toNumberOrNull(dto.minTemperature),
  pm10Grade: toPmGrade(dto.pm10Grade),
  pm25Grade: toPmGrade(dto.pm25Grade),
  // ⚠️ null 방어 없음 — uvIndex가 숫자가 아니면 모든 조건 비교가 실패해 조용히 '낮음'으로 떨어짐
  // (백엔드 스펙 확정 전까지 임시 상태, docs/backend-migration-todo.md 참고)
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

    // 2. data 중 current/현재 날씨가 없거나 기온이 숫자가 아닐때, Error 반환 
    const current = res.data?.current;
    if (!current || typeof current.temperature !== 'number')
      throw apiError(`weather API returned invalid shaped 'current': ${JSON.stringify(current)}`, { area: AREA, endpoint: res._requestUrl });

    // 2. data 중 hourly/시간별 날씨가 비어서왔을때 
    const hourlyRaw = Array.isArray(res.data.hourly) ? res.data.hourly : [];
    const hourly = hourlyRaw
      .map(toHourly)
      .filter(isDrawable)
      .sort((a, b) => a.epoch - b.epoch);

    return { current: toCurrent(current), hourly };
  },
});
