// 레포지토리: 흡연 부스/구역 응답(DTO)을 도메인 엔티티로 변환해 제공
import type { SmokingSpot } from '../../domain/entities/SmokingSpot.js';
import type { SmokingSpotRepository } from '../../domain/repositories/ISmokingSpotRepository.js';
import type { SmokingSpotApiDataSource, SmokingSpotApiResponse } from '../datasources/SmokingSpotApiDataSource.js';

// DTO → 엔티티 매핑은 데이터 레이어의 책임 
function toSmokingSpot(raw: SmokingSpotApiResponse): SmokingSpot {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    campus: raw.campus,
    coordinates: raw.coordinates,
    hasAshtray: raw.hasAshtray ?? false,
    description: raw.description ?? '',
    imageUrl: raw.imageUrl ?? [],
  };
}

export const createSmokingSpotRepository = ({ smokingSpotApiDataSource }: { smokingSpotApiDataSource: SmokingSpotApiDataSource }): SmokingSpotRepository => ({
    getSmokingSpots: async () => (await smokingSpotApiDataSource.getSmokingSpots()).map(toSmokingSpot),
});
