// 레포지토리: 제휴 매장 응답(DTO)을 도메인 엔티티로 변환해 제공
import type { PartnerStore } from '../../domain/entities/PartnerStore.js';
import type { PartnerStoreRepository } from '../../domain/repositories/IPartnerStoreRepository.js';
import type { PartnerStoreApiDataSource, PartnershipApiResponse } from '../datasources/PartnerStoreApiDataSource.js';

// DTO → 엔티티 매핑은 데이터 레이어의 책임.
// 나중에 이 데이터가 정적 JSON에서 백엔드 API로 옮겨가 필드명·형식이 바뀌어도
// 이 함수에서만 컴파일 에러가 나고, 도메인·프레젠테이션 로직은 그대로 둘 수 있다.
function toPartnerStore(raw: PartnershipApiResponse): PartnerStore {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    is_active: raw.is_active,
    emoji: raw.emoji,
    // 빠질 수 있는 필드는 여기서 기본값을 채워, 도메인부터는 형태가 항상 일정하게 한다.
    // 특히 location은 폐업 매장에서 통째로 없을 수 있어 좌표까지 null로 정규화한다.
    summary_benefit: raw.summary_benefit ?? null,
    location: {
      // 위경도가 둘 다 있을 때만 좌표로 인정한다 — 한쪽만 있는 반쪽짜리는 도메인에 들이지 않는다
      coordinates: raw.location?.latitude != null && raw.location?.longitude != null
        ? { latitude: raw.location.latitude, longitude: raw.location.longitude }
        : null,
      address: raw.location?.address ?? null,
      full_address: raw.location?.full_address ?? null,
    },
    kakao_place_id: raw.kakao_place_id ?? null,
    partnerships: raw.partnerships ?? [],
  };
}

export const createPartnerStoreRepository = ({ partnerStoreApiDataSource }: { partnerStoreApiDataSource: PartnerStoreApiDataSource }): PartnerStoreRepository => ({
    getPartnerStores: async () => (await partnerStoreApiDataSource.getPartnerStores()).map(toPartnerStore),
});
