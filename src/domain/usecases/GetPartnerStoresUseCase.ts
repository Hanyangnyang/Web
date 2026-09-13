// 유스케이스: 제휴 업체 리스트 조회
import type { PartnerStore } from "../entities/PartnerStore.js";
import type { PartnerStoreRepository } from "../repositories/IPartnerStoreRepository.js";

export interface GetPartnerStoresUseCase {
    execute: () => Promise<PartnerStore[]>;
}

export const createGetPartnerStoresUseCase = (
    { partnerStoreRepository }: { partnerStoreRepository: PartnerStoreRepository }
): GetPartnerStoresUseCase => ({
    execute: () => partnerStoreRepository.getPartnerStores(),
});