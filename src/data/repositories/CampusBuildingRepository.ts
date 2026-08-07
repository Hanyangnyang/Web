// 레포지토리: 캠퍼스 건물 목록을 도메인 엔티티로 변환해 제공
import { createCampusBuildings } from '../../domain/entities/CampusBuilding.js';
import type { CampusBuildingRepository } from '../../domain/repositories/ICampusBuildingRepository.js';
import type { CampusBuildingApiDataSource } from '../datasources/CampusBuildingApiDataSource.js';

export const createCampusBuildingRepository = ({ campusBuildingApiDataSource }: { campusBuildingApiDataSource: CampusBuildingApiDataSource }): CampusBuildingRepository => ({
    getCampusBuildings: async () => createCampusBuildings(await campusBuildingApiDataSource.getCampusBuildings()),
});
