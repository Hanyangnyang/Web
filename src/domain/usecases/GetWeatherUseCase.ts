// 유스케이스: 소식탭 날씨 정보 조회
import type { Weather } from '../entities/Weather.js';
import type { PortalRepository } from '../../data/repositories/PortalRepository.js';

export interface GetWeatherUseCase {
  execute: () => Promise<Weather>;
}

export const createGetWeatherUseCase = (
  { portalRepository }: { portalRepository: PortalRepository }
): GetWeatherUseCase => ({
  execute: () => portalRepository.getWeather(),
});
