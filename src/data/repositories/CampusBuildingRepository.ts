// 레포지토리: 캠퍼스 건물 응답(DTO)을 도메인 엔티티로 변환해 제공
import type { CampusBuilding } from '../../domain/entities/CampusBuilding.js';
import type { CampusBuildingRepository } from '../../domain/repositories/ICampusBuildingRepository.js';
import type { CampusBuildingApiDataSource, CampusBuildingApiResponse } from '../datasources/CampusBuildingApiDataSource.js';

// DTO → 엔티티 매핑은 데이터 레이어의 책임이다.
// 바깥 스키마(필드명·형식)가 바뀌면 이 함수에서만 컴파일 에러가 나고,
// 도메인·프레젠테이션은 그대로 둘 수 있다 — 그게 이 레이어를 두는 이유다.
function toCampusBuilding(raw: CampusBuildingApiResponse): CampusBuilding {
  return {
    id: raw.id,
    buildingNumber: raw.buildingNumber,
    name: raw.name,
    campus: raw.campus,
    coordinates: raw.coordinates,
    // 빠질 수 있는 필드는 여기서 기본값을 채워, 도메인부터는 항상 값이 있다고 믿을 수 있게 한다
    englishName: raw.englishName ?? '',
    aliases: raw.aliases ?? [],
    description: raw.description ?? '',
    primaryColleges: raw.primaryColleges ?? [],
    openSpaces: raw.openSpaces ?? [],
    facilities: raw.facilities ?? [],
    imageUrl: raw.imageUrl ?? [],
  };
}

export const createCampusBuildingRepository = ({ campusBuildingApiDataSource }: { campusBuildingApiDataSource: CampusBuildingApiDataSource }): CampusBuildingRepository => ({
    getCampusBuildings: async () => (await campusBuildingApiDataSource.getCampusBuildings()).map(toCampusBuilding),
});
