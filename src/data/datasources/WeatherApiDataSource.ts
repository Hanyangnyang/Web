// 데이터 소스: 소식탭 날씨/대기질/UV API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 응답 shape은 검증 전이라 unknown — 실제 파싱/타입 부여는 WeatherSchema.ts의 zod 스키마가 Repository에서 담당
export interface WeatherApiDataSource {
  getWeather: () => Promise<ApiResponse<unknown>>;
}

export const createWeatherApiDataSource = ({ httpClient }: { httpClient: HttpClient }): WeatherApiDataSource => ({
  getWeather: async () => parseOrThrow(await httpClient.get('/api/v1/weather')),
});
