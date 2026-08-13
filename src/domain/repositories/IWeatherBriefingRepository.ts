// 도메인 레포지토리 인터페이스: AI 날씨 브리핑 제공 계약 (구현은 data 레이어의 WeatherBriefingRepository)
import type { WeatherBriefing } from '../entities/WeatherBriefing.js';

export interface GetWeatherBriefingOptions {
  location?: string;
  dateTime?: string;
}

export interface WeatherBriefingRepository {
  // 보여줄 브리핑이 없으면 null — 호출부는 기본 문구로 대체한다.
  // (조회 자체가 실패한 경우는 throw로 구분한다)
  getBriefing: (options?: GetWeatherBriefingOptions) => Promise<WeatherBriefing | null>;
}
