// 레포지토리: 흡연 부스/구역 응답(DTO)을 도메인 엔티티로 변환해 제공
import type { SmokingSpot } from '../../domain/entities/SmokingSpot.js';
import { normalizeCoordinates } from '../../domain/entities/Coordinates.js';
import type { SmokingSpotRepository } from '../../domain/repositories/ISmokingSpotRepository.js';
import type { SmokingSpotApiDataSource, SmokingSpotDto } from '../datasources/SmokingSpotApiDataSource.js';

// Data 단의 Dto → Domain 단의 엔티티 매핑  
function toSmokingSpot(raw: SmokingSpotDto): SmokingSpot {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    campus: raw.campus,
    coordinates: normalizeCoordinates(raw.coordinates),
    hasAshtray: raw.hasAshtray ?? false,
    description: raw.description ?? '',
    imageUrl: raw.imageUrl ?? [],
  };
}

export const createSmokingSpotRepository = ({ smokingSpotApiDataSource }: { smokingSpotApiDataSource: SmokingSpotApiDataSource }): SmokingSpotRepository => ({
    getSmokingSpots: async () => (await smokingSpotApiDataSource.getSmokingSpots()).map(toSmokingSpot),
});
