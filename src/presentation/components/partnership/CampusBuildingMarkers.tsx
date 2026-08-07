// 지도 위 캠퍼스 건물 마커 (건물 칩이 선택됐을 때만 렌더링)
// 이모지 없이 빈 핀만 — 카카오 기본 지도가 표시하는 건물명 텍스트와 겹치지 않게 좀 더 심플하게 둔다.
// 실좌표 그대로 찍는다 (화면상 띄우는 처리는 하지 않음).
// 줌 아웃 시 점으로 바뀌는 동작은 매장과 동일 — MapMarkerPoint(공용)에 맡긴다.
import type { CampusBuilding } from '../../../domain/entities/CampusBuilding.js';
import { MapMarkerPoint } from './MapMarkerPoint';

interface Props {
  buildings: CampusBuilding[];
  level: number;
  selectedId: string | null;
  onSelect: (building: CampusBuilding) => void;
}

export function CampusBuildingMarkers({ buildings, level, selectedId, onSelect }: Props) {
  return (
    <>
      {buildings.map((building) => {
        const selected = building.id === selectedId;
        return (
          <MapMarkerPoint
            key={building.id}
            lat={building.coordinates.latitude}
            lng={building.coordinates.longitude}
            level={level}
            selected={selected}
            onClick={() => onSelect(building)}
            ariaLabel={building.name}
            zIndexNormal={3}
            zIndexSelected={22}
          />
        );
      })}
    </>
  );
}
