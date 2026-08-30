// 도메인 레포지토리 인터페이스: AI 날씨 브리핑 제공 계약 (구현은 data 레이어의 WeatherBriefingRepository)
import type { WeatherBriefing } from '../entities/WeatherBriefing.js';

export interface GetWeatherBriefingOptions {
  location?: string;
  dateTime?: string;
}

export interface WeatherBriefingRepository {
  getBriefing: (options?: GetWeatherBriefingOptions) => Promise<WeatherBriefing | null>;
}
