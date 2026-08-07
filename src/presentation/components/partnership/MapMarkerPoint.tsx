// 지도 위 마커 하나 — 선택되지 않았으면 배율과 무관하게 점, 선택되면 핀으로 전환한다.
// 매장·건물·흡연장 세 레이어가 공유하는 렌더링 단위 (markerZoom.ts의 기준을 함께 쓴다).
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { MapPinMarker } from './MapPinMarker';
import { isDotMode, dotSizePx } from './markerZoom';

interface Props {
  lat: number;
  lng: number;
  level: number;
  selected: boolean;
  onClick: () => void;
  ariaLabel: string;
  zIndexNormal: number;
  zIndexSelected: number;
}

export function MapMarkerPoint({
  lat, lng, level, selected, onClick, ariaLabel, zIndexNormal, zIndexSelected,
}: Props) {
  if (isDotMode(selected)) {
    const dotPx = dotSizePx(level);
    return (
      <CustomOverlayMap position={{ lat, lng }} yAnchor={0.5} zIndex={zIndexNormal}>
        <div style={{ width: 0 }} className="flex justify-center">
          <button
            onClick={onClick}
            aria-label={ariaLabel}
            className="flex items-center justify-center p-2 [-webkit-tap-highlight-color:transparent]"
          >
            <span
              className="block rounded-full bg-[#EF4444]"
              style={{ width: dotPx, height: dotPx, boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            />
          </button>
        </div>
      </CustomOverlayMap>
    );
  }

  return (
    <CustomOverlayMap
      position={{ lat, lng }}
      xAnchor={0.5}
      yAnchor={1}
      zIndex={selected ? zIndexSelected : zIndexNormal}
    >
      <MapPinMarker selected={selected} onClick={onClick} ariaLabel={ariaLabel} />
    </CustomOverlayMap>
  );
}
