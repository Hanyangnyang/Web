// 레포지토리: 제휴 매장 응답(DTO)을 도메인 엔티티로 변환해 제공
import type { PartnerStore, Partnership, PartnershipPeriod } from '../../domain/entities/PartnerStore.js';
import { normalizeCoordinates } from '../../domain/entities/Coordinates.js';
import type { PartnerStoreRepository } from '../../domain/repositories/IPartnerStoreRepository.js';
import type {
  PartnerStoreApiDataSource, PartnerStoreDto, PartnershipDto, PartnershipPeriodDto,
} from '../datasources/PartnerStoreApiDataSource.js';

// Data 단의 Dto → Domain 단의 엔티티 매핑
function toPartnershipPeriod(raw: PartnershipPeriodDto): PartnershipPeriod {
  return {
    startDate: raw.start_date ?? null,
    endDate: raw.end_date ?? null,
    isActive: raw.is_active,
  };
}

function toPartnership(raw: PartnershipDto): Partnership {
  return {
    collegeId: raw.college_id,
    collegeName: raw.college_name,
    benefit: raw.benefit ?? null,
    period: raw.period ? toPartnershipPeriod(raw.period) : null,
    conditions: raw.conditions ?? null,
    sourceUrl: raw.source_url ?? null,
  };
}

function toPartnerStore(raw: PartnerStoreDto): PartnerStore {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    isActive: raw.is_active,
    emoji: raw.emoji,
    summaryBenefit: raw.summary_benefit ?? null,
    location: {
      coordinates: normalizeCoordinates(raw.location),
      address: raw.location?.address ?? null,
      fullAddress: raw.location?.full_address ?? null,
    },
    kakaoPlaceId: raw.kakao_place_id ?? null,
    partnerships: (raw.partnerships ?? []).map(toPartnership),
  };
}

export const createPartnerStoreRepository = ({ partnerStoreApiDataSource }: { partnerStoreApiDataSource: PartnerStoreApiDataSource }): PartnerStoreRepository => ({
    getPartnerStores: async () => (await partnerStoreApiDataSource.getPartnerStores()).map(toPartnerStore),
});
