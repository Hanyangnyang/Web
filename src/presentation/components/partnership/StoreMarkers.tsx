// 지도 위 매장 마커 렌더링 — 개수 뱃지로 묶지 않고 항상 모든 매장을 개별 표시한다.
// 점/핀 전환은 MapMarkerPoint(공용)에 맡기고, 여기서는 매장 고유의 이름 라벨만 추가로 얹는다.
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import type { PartnerStore } from '../../../domain/entities/PartnerStore.js';
import type { PlottedStore } from './storeLayout';
import { MapMarkerPoint } from './MapMarkerPoint';

interface Props {
  stores: PlottedStore[];
  level: number;                   // 현재 줌 레벨 — 이름표 상시 표시 기준 (마커 자체의 점/핀 전환은 선택 여부로만 결정)
  selectedId: string | null;
  onSelectStore: (store: PartnerStore) => void;
}

// 이 레벨 이하(최대 확대)에서는 선택 여부와 무관하게 이름을 상시 표시한다.
const LABEL_VISIBLE_MAX_LEVEL = 1;

export function StoreMarkers({ stores, level, selectedId, onSelectStore }: Props) {
  return (
    <>
      {stores.map(({ lat, lng, store }) => {
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
                    className={`px-1 text-[11px] font-bold whitespace-nowrap active:scale-95 transition-transform [-webkit-tap-highlight-color:transparent] [text-shadow:0_0_3px_#fff,0_0_3px_#fff,0_1px_2px_#fff] ${
                      selected ? 'text-[#0E4A84]' : 'text-[#334155]'
                    }`}
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
