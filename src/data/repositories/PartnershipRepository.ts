// 레포지토리: 제휴 업체 리스트를 도메인 엔티티로 변환해 제공 
import {createPartnerStores} from "../../domain/entities/PartnerStore.js";
import type { PartnershipRepository } from "../../domain/repositories/IPartnershipRepository.js";
import type { PartnershipApiDataSource } from "../datasources/PartnershipApiDataSource.js";

export const createPartnershipRepository = ({ partnershipApiDataSource }: { partnershipApiDataSource: PartnershipApiDataSource }): PartnershipRepository => ({
    getPartnerStores: async () => createPartnerStores(await partnershipApiDataSource.getPartnerStores()),
});