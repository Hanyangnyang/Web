// 지도 위 매장 마커 렌더링 — 개수 뱃지로 묶지 않고 항상 모든 매장을 개별 표시한다.
// 점/핀 전환은 MapMarkerPoint(공용)에 맡기고, 여기서는 매장 고유의 이름 라벨만 추가로 얹는다.
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { PartnerStore, PlottableStore } from '../../../domain/entities/PartnerStore.js';
import { MapMarkerPoint } from './MapMarkerPoint';
import { MARKER_LABEL_COLOR, MARKER_LABEL_SELECTED_COLOR } from './markerColors';

interface Props {
  stores: PlottableStore[];   // 좌표가 확정된 매장만 (hasCoords로 걸러 넘긴다)
  level: number;                   // 현재 줌 레벨 — 이름표 상시 표시 기준 (마커 자체의 점/핀 전환은 선택 여부로만 결정)
  selectedId: string | null;
  onSelectStore: (store: PartnerStore) => void;
}

// 이 레벨 이하(최대 확대)에서는 선택 여부와 무관하게 이름을 상시 표시한다.
const LABEL_VISIBLE_MAX_LEVEL = 1;

// 이름표 글자 크기(px). 선택된 것만 한 단계 키워 색과 함께 이중으로 강조한다.
// 최대 확대에선 모든 매장 이름이 한꺼번에 뜨므로, 기본값을 더 키우면 라벨끼리 겹치기 시작한다.
const LABEL_FONT_PX = 12;
const LABEL_FONT_PX_SELECTED = 13;

export function StoreMarkers({ stores, level, selectedId, onSelectStore }: Props) {
  return (
    <>
      {stores.map((store) => {
        const { latitude: lat, longitude: lng } = store.location.coordinates;
        const selected = store.id === selectedId;

        return (
          <>
            <MapMarkerPoint
              key={store.id}
              lat={lat}
              lng={lng}
              level={level}
              selected={selected}
              onClick={() => onSelectStore(store)}
              ariaLabel={store.name}
              zIndexNormal={1}
              zIndexSelected={20}
            />

            {/* 이름 라벨: 배경 박스 없이 글씨만 — 가독성은 흰색 텍스트 섀도우(halo)로 확보.
                마커가 점이든 핀이든 상관없이, 배율 기준(선택되었거나 충분히 확대됐을 때)으로만 표시한다. */}
            {(selected || level <= LABEL_VISIBLE_MAX_LEVEL) && (
              <CustomOverlayMap
                key={`${store.id}-label`}
                position={{ lat, lng }}
                xAnchor={0.5}
                yAnchor={0}
                zIndex={selected ? 21 : 4}
              >
                <div style={{ width: 0 }} className="flex justify-center mt-0.5">
                  <button
                    onClick={() => onSelectStore(store)}
                    aria-label={store.name}
                    // 색·크기 모두 동적이라 Tailwind 임의값 대신 inline style로 준다 (동적 클래스는 스캐너가 못 잡음)
                    style={{
                      color: selected ? MARKER_LABEL_SELECTED_COLOR : MARKER_LABEL_COLOR,
                      fontSize: selected ? LABEL_FONT_PX_SELECTED : LABEL_FONT_PX,
                    }}
                    className="px-1 font-bold whitespace-nowrap active:scale-95 transition-transform [-webkit-tap-highlight-color:transparent] [text-shadow:0_0_3px_#fff,0_0_3px_#fff,0_1px_2px_#fff]"
                  >
                    {store.name}
                  </button>
                </div>
              </CustomOverlayMap>
            )}
          </>
        );
      })}
    </>
  );
}
