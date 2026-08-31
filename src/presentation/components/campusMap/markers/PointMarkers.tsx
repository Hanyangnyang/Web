// 지도 위 '점 마커만' 찍는 레이어 — 교내시설과 흡연장이 공유한다.
// 이모지 없이 빈 핀만 쓴다: 카카오 기본 지도가 그리는 건물명 텍스트와 겹치지 않게 심플하게 둔다.
// 실좌표 그대로 찍으며(화면상 띄우는 처리 없음), 줌 아웃 시 점으로 바뀌는 동작은 MapMarkerPoint(공용)에 맡긴다.
//
// 매장(StoreMarkers)은 여기 들어오지 않는다 — 이름 라벨 오버레이가 더 붙고 z-index 층도 달라서,
// 공통화하면 "라벨 있는 마커"와 "점만 찍는 마커"의 차이가 옵션 뒤로 숨는다.
import type { Coordinates } from '../../../../domain/entities/Coordinates.js';
import { MapMarkerPoint } from './MapMarkerPoint';

/** 점 마커로 찍히기 위해 필요한 최소 조건 — 건물·흡연장 엔티티가 모두 만족한다 */
interface MarkerPoint {
  id: string;
  name: string;
  coordinates: Coordinates;
}

interface Props<T extends MarkerPoint> {
  items: T[];
  level: number;
  selectedId: string | null;
  onSelect: (item: T) => void;
}

// 제네릭이라 onSelect가 넘겨받은 항목의 구체 타입(CampusBuilding·SmokingSpot)을 그대로 돌려준다
export function PointMarkers<T extends MarkerPoint>({ items, level, selectedId, onSelect }: Props<T>) {
  return (
    <>
      {items.map((item) => (
        <MapMarkerPoint
          key={item.id}
          lat={item.coordinates.latitude}
          lng={item.coordinates.longitude}
          level={level}
          selected={item.id === selectedId}
          onClick={() => onSelect(item)}
          ariaLabel={item.name}
          zIndexNormal={3}
          zIndexSelected={22}
        />
      ))}
    </>
  );
}
