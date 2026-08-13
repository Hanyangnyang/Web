// 데이터 소스: 소식탭 날씨/대기질/UV API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface WeatherSnapshotDto {
  forecastAt: string;               // 'YYYY-MM-DDTHH:mm:ss' — 타임존 표기 없는 한국 시각
  temperature: number;              // 기온 (℃)
  humidity: number;                 // 습도 (%)
  weatherCondition: string | null;  // SUNNY 맑음☀️ / MOSTLY_CLOUDY 구름많음⛅ / CLOUDY 흐림☁️ / RAIN 비🌧️ / RAIN_SNOW 비눈🌧️❄️ / SNOW 눈❄️ / SHOWER 소나기🌦️ / null = 날씨 예보 수신 전
  precipitation: number;            // 강수량 (mm)
  pm10Value: number;                          
  pm10Grade: number | null;         // 관측값: 1 좋음🔵 / 2 보통🟢 / 3 나쁨🟠 / 4 매우나쁨🔴, null = 점검중
  pm25Value: number;
  pm25Grade: number | null;         // 관측값: 1 좋음🔵 / 2 보통🟢 / 3 나쁨🟠 / 4 매우나쁨🔴, null = 점검중
  uvIndex: number;                  // 관측값: 0 낮음🟢 / 1 낮음🟢 / 2 낮음🟢 / 3 보통🟡 / 4 보통🟡 / 5 높음🟠 / 6 높음🟠 / 7 매우높음🔴 / 8 매우높음🔴 / 9 위험⚫ / 10 위험⚫
}

export interface HourlyForecastDto extends WeatherSnapshotDto {
  precipProbability: number;           // 강수확률 (%)
}

export interface CurrentWeatherDto extends WeatherSnapshotDto {
  maxTemperature: number;              // 오늘 최고기온(℃)
  minTemperature: number;              // 오늘 최저기온(℃)
}

// 응답 구조 
export interface WeatherResponseDto {
  current: CurrentWeatherDto;
  hourly: HourlyForecastDto[];        // 과거~미래 48시간 슬라이더용
}

export interface WeatherApiDataSource {
  getWeather: () => Promise<ApiResponse<WeatherResponseDto>>;
}

export const createWeatherApiDataSource = ({ httpClient }: { httpClient: HttpClient }): WeatherApiDataSource => ({
  getWeather: async () => parseOrThrow(await httpClient.get('/api/v1/weather')),
});
