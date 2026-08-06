// 유스케이스: 제휴 업체 리스트 조회
import type { PartnerStore } from "../entities/PartnerStore.js";
import type { PartnershipRepository } from "../repositories/IPartnershipRepository.js";

export interface GetPartnershipStoresUseCase {
    execute: () => Promise<PartnerStore[]>;
}

export const createGetPartnershipStoresUseCase = (
    { partnershipRepository }: { partnershipRepository: PartnershipRepository }
): GetPartnershipStoresUseCase => ({
    execute: () => partnershipRepository.getPartnerStores(),
});