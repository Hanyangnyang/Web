// 도메인 엔티티: 캠퍼스 건물
import { normalizeForSearch, matchesQuery } from '../../lib/searchText.js';
import type { Coordinates } from './Coordinates.js';
import type { OpenSpace } from './OpenSpace.js';

export interface CampusBuilding {
  id: string;
  buildingNumber: string;
  name: string;
  englishName: string;
  aliases: string[];
  campus: string;
  coordinates: Coordinates | null;
  description: string;
  primaryColleges: string[];
  openSpaces: OpenSpace[];
  facilities: string[];
  imageUrl: string[];
}

export type PlottableBuilding = CampusBuilding & { coordinates: Coordinates };

export function hasCoords(building: CampusBuilding): building is PlottableBuilding {
  return building.coordinates !== null;
}

// 좌표값이 있는 건물들 필터 함수 
export function visibleBuildings(buildings: CampusBuilding[]): PlottableBuilding[] {
  return buildings.filter(hasCoords);
}

export function hasOpenSpace(building: CampusBuilding): boolean {
  return building.openSpaces.length > 0;
}

// 오픈스페이스 필터 함수
export function openSpaceBuildings<T extends CampusBuilding>(buildings: T[]): T[] {
  return buildings.filter(hasOpenSpace);
}

// 모든 오픈스페이스를 평탄화하여 반환한다. (건물별로 묶여있던 것을 한 리스트로)
export function allOpenSpaces(buildings: CampusBuilding[]): OpenSpace[] {
  return buildings.flatMap((b) => b.openSpaces);
}

// 건물 검색 함수 
export function searchBuildings(buildings: CampusBuilding[], query: string): PlottableBuilding[] {
  const q = normalizeForSearch(query.trim());
  if (!q) return [];
  return buildings.filter(
    (b): b is PlottableBuilding =>
      hasCoords(b) &&
      (matchesQuery(b.buildingNumber, q) ||
        matchesQuery(b.name, q) ||
        b.aliases.some((alias) => matchesQuery(alias, q)))
  );
}
