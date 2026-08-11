// 도메인 엔티티: 캠퍼스 건물
import { normalizeForSearch, matchesQuery } from '../../lib/searchText.js';
import { isNullIsland, type Coordinates } from './Coordinates.js';

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

/** 좌표가 채워져 지도에 표시 가능한 건물인지 (지오코딩 미확보분은 0,0으로 들어있다) */
export function hasCoords(building: CampusBuilding): boolean {
  return !isNullIsland(building.coordinates);
}

export function visibleBuildings(buildings: CampusBuilding[]): CampusBuilding[] {
  return buildings.filter(hasCoords);
}

/** 개방된 휴게 공간(오픈스페이스·열람실 등)이 있는 건물인지 */
export function hasOpenSpace(building: CampusBuilding): boolean {
  return building.openSpaces.length > 0;
}

export function openSpaceBuildings(buildings: CampusBuilding[]): CampusBuilding[] {
  return buildings.filter(hasOpenSpace);
}

/**
 * 건물 검색 — 동번호·정식 명칭·별칭(aliases) 어느 쪽이든 부분 일치하면 잡는다.
 * 부분 일치라서 '1공학'처럼 끝까지 안 쳐도 '제1공학관'이 나오고,
 * '과기'처럼 정식 명칭엔 없는 줄임말은 aliases가 받아준다.
 * 동번호는 강의실 표기('301동', 'C01')를 보고 찾는 경우가 많아 함께 대상에 넣는다.
 * 지도에 찍을 수 없는(좌표 미확보) 건물은 검색 결과에서도 제외한다.
 */
export function searchBuildings(buildings: CampusBuilding[], query: string): CampusBuilding[] {
  const q = normalizeForSearch(query.trim());
  if (!q) return [];
  return buildings.filter(
    (b) =>
      hasCoords(b) &&
      (matchesQuery(b.buildingNumber, q) ||
        matchesQuery(b.name, q) ||
        b.aliases.some((alias) => matchesQuery(alias, q)))
  );
}
