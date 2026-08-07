// 지도 위 흡연 부스/구역 마커 (흡연장 칩이 선택됐을 때만 렌더링)
// 줌 아웃 시 점으로 바뀌는 동작은 매장과 동일 — MapMarkerPoint(공용)에 맡긴다.
import type { SmokingSpot } from '../../../domain/entities/SmokingSpot.js';
import { MapMarkerPoint } from './MapMarkerPoint';

interface Props {
  spots: SmokingSpot[];
  level: number;
  selectedId: string | null;
  onSelect: (spot: SmokingSpot) => void;
}

export function SmokingSpotMarkers({ spots, level, selectedId, onSelect }: Props) {
  return (
    <>
      {spots.map((spot) => {
        const selected = spot.id === selectedId;
        return (
          <MapMarkerPoint
            key={spot.id}
            lat={spot.coordinates.latitude}
            lng={spot.coordinates.longitude}
            level={level}
            selected={selected}
            onClick={() => onSelect(spot)}
            ariaLabel={spot.name}
            zIndexNormal={3}
            zIndexSelected={22}
          />
        );
      })}
    </>
  );
}
