// 도메인 엔티티: 캠퍼스 건물
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CampusBuilding {
  id: string;
  buildingNumber: string;
  name: string;
  englishName: string;
  aliases: string[];
  campus: string;
  coordinates: Coordinates;
  description: string;
  primaryColleges: string[];
  openSpaces: string[];
  facilities: string[];
  imageUrl: string[];
}

export function createCampusBuilding(raw: CampusBuilding): CampusBuilding {
  return {
    id: raw.id,
    buildingNumber: raw.buildingNumber,
    name: raw.name,
    englishName: raw.englishName ?? '',
    aliases: raw.aliases ?? [],
    campus: raw.campus,
    coordinates: raw.coordinates,
    description: raw.description ?? '',
    primaryColleges: raw.primaryColleges ?? [],
    openSpaces: raw.openSpaces ?? [],
    facilities: raw.facilities ?? [],
    imageUrl: raw.imageUrl ?? [],
  };
}

export function createCampusBuildings(rawList: CampusBuilding[]): CampusBuilding[] {
  return rawList.map(createCampusBuilding);
}

/** 좌표가 채워져 지도에 표시 가능한 건물인지 (미확보 좌표는 0,0으로 들어있다) */
export function hasCoords(building: CampusBuilding): boolean {
  return building.coordinates.latitude !== 0 || building.coordinates.longitude !== 0;
}

export function visibleBuildings(buildings: CampusBuilding[]): CampusBuilding[] {
  return buildings.filter(hasCoords);
}
