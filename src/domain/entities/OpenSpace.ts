// 도메인 엔티티: 개방된 휴게·열람 공간 (오픈스페이스·열람실 등)
import type { Coordinates } from './Coordinates.js';

export interface OpenSpace {
  id: string;
  buildingId: string;
  floor: string | null;
  name: string;
  hint: string | null;
}

export function openSpaceLabel(space: OpenSpace): string {
  return space.floor ? `${space.floor} ${space.name}` : space.name;
}

// 좌표를 건물 ID로 찾아 반환한다. 없으면 null
export function openSpaceCoordinates(
  space: OpenSpace,
  buildings: { id: string; coordinates: Coordinates }[],
): Coordinates | null {
  return buildings.find((b) => b.id === space.buildingId)?.coordinates ?? null;
}
