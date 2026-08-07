// 도메인 엔티티: 흡연 부스/구역
import type { Coordinates } from './CampusBuilding.js';

export type SmokingSpotType = 'BOOTH' | 'AREA';

export interface SmokingSpot {
  id: string;
  name: string;
  type: SmokingSpotType;
  campus: string;
  coordinates: Coordinates;
  hasAshtray: boolean;
  description: string;
  imageUrl: string[];
}

export function createSmokingSpot(raw: SmokingSpot): SmokingSpot {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    campus: raw.campus,
    coordinates: raw.coordinates,
    hasAshtray: raw.hasAshtray ?? false,
    description: raw.description ?? '',
    imageUrl: raw.imageUrl ?? [],
  };
}

export function createSmokingSpots(rawList: SmokingSpot[]): SmokingSpot[] {
  return rawList.map(createSmokingSpot);
}

export const SMOKING_SPOT_TYPE_LABEL: Record<SmokingSpotType, string> = {
  BOOTH: '흡연부스',
  AREA: '흡연구역',
};
