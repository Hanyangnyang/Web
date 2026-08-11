// 데이터 소스: 소식탭 날씨 API 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface HourlyForecastDto {
  time: string;
  epoch: number;
  hour: number;
  temp: number;
  weatherCode: number;
  precipProb: number;
}

export interface AirQualityLevelDto {
  label: string;
  color: string;
  level: number;
}

export interface AirQualityDto {
  pm10: AirQualityLevelDto;
  pm25: AirQualityLevelDto;
  uv: AirQualityLevelDto;
}

export interface WeatherResponseDto {
  temp: number;
  description: string;
  emoji: string;
  weatherCode: number;
  message: string;
  isAiMessage?: boolean;
  hasPrecipitation?: boolean;
  hourlyForecast?: HourlyForecastDto[];
  airQuality?: AirQualityDto | null;
}

export interface WeatherApiDataSource {
  getWeather: () => Promise<WeatherResponseDto>;
}

export const createWeatherApiDataSource = ({ httpClient }: { httpClient: HttpClient }): WeatherApiDataSource => ({
  getWeather: async () => parseOrThrow(await httpClient.get('/api/portal?type=weather')),
});
