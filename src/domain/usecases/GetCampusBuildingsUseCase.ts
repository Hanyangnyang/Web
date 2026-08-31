// 유스케이스: 캠퍼스 건물 목록 조회
import type { CampusBuilding } from "../entities/CampusBuilding.js";
import type { CampusBuildingRepository } from "../repositories/ICampusBuildingRepository.js";

export interface GetCampusBuildingsUseCase {
    execute: () => Promise<CampusBuilding[]>;
}

export const createGetCampusBuildingsUseCase = (
    { campusBuildingRepository }: { campusBuildingRepository: CampusBuildingRepository }
): GetCampusBuildingsUseCase => ({
    execute: () => campusBuildingRepository.getCampusBuildings(),
});
