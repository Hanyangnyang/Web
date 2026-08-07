// 레포지토리: 흡연 부스/구역 목록을 도메인 엔티티로 변환해 제공
import { createSmokingSpots } from '../../domain/entities/SmokingSpot.js';
import type { SmokingSpotRepository } from '../../domain/repositories/ISmokingSpotRepository.js';
import type { SmokingSpotApiDataSource } from '../datasources/SmokingSpotApiDataSource.js';

export const createSmokingSpotRepository = ({ smokingSpotApiDataSource }: { smokingSpotApiDataSource: SmokingSpotApiDataSource }): SmokingSpotRepository => ({
    getSmokingSpots: async () => createSmokingSpots(await smokingSpotApiDataSource.getSmokingSpots()),
});
