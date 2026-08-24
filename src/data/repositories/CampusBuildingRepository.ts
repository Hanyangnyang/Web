// 레포지토리: 캠퍼스 건물 응답(DTO)을 도메인 엔티티로 변환해 제공
import type { CampusBuilding } from '../../domain/entities/CampusBuilding.js';
import { normalizeCoordinates } from '../../domain/entities/Coordinates.js';
import type { OpenSpace } from '../../domain/entities/OpenSpace.js';
import type { CampusBuildingRepository } from '../../domain/repositories/ICampusBuildingRepository.js';
import type { CampusBuildingApiDataSource, CampusBuildingDto, OpenSpaceDto } from '../datasources/CampusBuildingApiDataSource.js';

// Data 단의 Dto → Domain 단의 엔티티 매핑
function toOpenSpace(raw: OpenSpaceDto, buildingId: string): OpenSpace {
  return {
    id: raw.id,
    buildingId,
    floor: raw.floor,
    name: raw.name,
    hint: raw.hint,
  };
}

function toCampusBuilding(raw: CampusBuildingDto): CampusBuilding {
  return {
    id: raw.id,
    buildingNumber: raw.buildingNumber,
    name: raw.name,
    campus: raw.campus,
    coordinates: normalizeCoordinates(raw.coordinates),
    englishName: raw.englishName ?? '',
    aliases: raw.aliases ?? [],
    description: raw.description ?? '',
    primaryColleges: raw.primaryColleges ?? [],
    openSpaces: (raw.openSpaces ?? []).map((space) => toOpenSpace(space, raw.id)),
    facilities: raw.facilities ?? [],
    imageUrl: raw.imageUrl ?? [],
  };
}

export const createCampusBuildingRepository = ({ campusBuildingApiDataSource }: { campusBuildingApiDataSource: CampusBuildingApiDataSource }): CampusBuildingRepository => ({
    getCampusBuildings: async () => (await campusBuildingApiDataSource.getCampusBuildings()).map(toCampusBuilding),
});
