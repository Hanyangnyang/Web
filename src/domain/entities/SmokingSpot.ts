// 도메인 엔티티: 흡연 부스/구역
import type { Coordinates } from './Coordinates.js';

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

export const SMOKING_SPOT_TYPE_LABEL: Record<SmokingSpotType, string> = {
  BOOTH: '흡연부스',
  AREA: '흡연구역',
};
