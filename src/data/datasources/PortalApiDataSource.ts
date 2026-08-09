// 데이터 소스: 소식탭 날씨·도서관 혼잡도 API 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface HourlyForecastApiItem {
  time: string;
  epoch: number;
  hour: number;
  temp: number;
  weatherCode: number;
  precipProb: number;
}

export interface AirQualityLevelApi {
  label: string;
  color: string;
  level: number;
}

export interface AirQualityApiResponse {
  pm10: AirQualityLevelApi;
  pm25: AirQualityLevelApi;
  uv: AirQualityLevelApi;
}

export interface WeatherApiResponse {
  temp: number;
  description: string;
  emoji: string;
  weatherCode: number;
  message: string;
  isAiMessage?: boolean;
  hasPrecipitation?: boolean;
  hourlyForecast?: HourlyForecastApiItem[];
  airQuality?: AirQualityApiResponse | null;
}

export interface LibraryApiRoom {
  id: number;
  name: string;
  seats: { total: number; occupied: number };
}

export interface LibraryApiResponse {
  success: boolean;
  data: { list: LibraryApiRoom[] };
}

export interface PortalApiDataSource {
  getWeather: () => Promise<WeatherApiResponse>;
  getLibrary: () => Promise<LibraryApiResponse>;
}

export const createPortalApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PortalApiDataSource => ({
  getWeather: async () => parseOrThrow(await httpClient.get('/api/portal?type=weather')),
  getLibrary: async () => parseOrThrow(await httpClient.get('/api/portal?type=library')),
});
