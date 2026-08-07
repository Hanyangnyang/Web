// 도메인 레포지토리 인터페이스: 캠퍼스 건물 목록 제공 (구현은 data 레이어의 CampusBuildingRepository)
import type { CampusBuilding } from '../entities/CampusBuilding.js';

export interface CampusBuildingRepository {
    getCampusBuildings: () => Promise<CampusBuilding[]>;
}
