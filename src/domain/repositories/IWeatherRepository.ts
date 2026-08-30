// 도메인 레포지토리 인터페이스: 소식탭 날씨 정보 제공 계약 (구현은 data 레이어의 WeatherRepository)
import type { Weather } from '../entities/Weather.js';

export interface WeatherRepository {
  getWeather: () => Promise<Weather>;
}
