// 도메인 레포지토리 인터페이스: 제휴 업체 리스트 제공 (구현은 data 레이어의 PartnerStoreRepository)
import type { PartnerStore } from '../entities/PartnerStore.js';

export interface PartnerStoreRepository {
    getPartnerStores: () => Promise<PartnerStore[]>;
}