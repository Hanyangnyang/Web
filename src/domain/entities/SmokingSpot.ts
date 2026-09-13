// 도메인 엔티티: 흡연 부스/구역
import type { Coordinates } from './Coordinates.js';

export type SmokingSpotType = 'BOOTH' | 'AREA';

export interface SmokingSpot {
  id: string;
  name: string;
  type: SmokingSpotType;
  campus: string;
  coordinates: Coordinates | null;
  hasAshtray: boolean;
  description: string;
  imageUrl: string[];
}

export type PlottableSmokingSpot = SmokingSpot & { coordinates: Coordinates };

function hasCoords(spot: SmokingSpot): spot is PlottableSmokingSpot {
  return spot.coordinates !== null;
}

// 좌표가 있는 흡연 부스/구역만 반환
export function visibleSmokingSpots(spots: SmokingSpot[]): PlottableSmokingSpot[] {
  return spots.filter(hasCoords);
}

export const SMOKING_SPOT_TYPE_LABEL: Record<SmokingSpotType, string> = {
  BOOTH: '흡연부스',
  AREA: '흡연구역',
};
