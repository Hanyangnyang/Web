// 지도 위 제휴 매장 마커 (커스텀 오버레이: 카테고리색 테두리 + 이모지)
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { CATEGORY_META, type PartnerStore } from './storeData';

interface Props {
  stores: PartnerStore[];
  selectedId: string | null;
  onSelect: (store: PartnerStore) => void;
}

export function StoreMarkers({ stores, selectedId, onSelect }: Props) {
  return (
    <>
      {stores.map((store) => {
        const { latitude, longitude } = store.location;
        if (latitude == null || longitude == null) return null;
        const selected = store.id === selectedId;

        return (
          <CustomOverlayMap
            key={store.id}
            position={{ lat: latitude, lng: longitude }}
            yAnchor={0.5}
            zIndex={selected ? 20 : 1}
          >
            <button
              onClick={() => onSelect(store)}
              className="flex flex-col items-center [-webkit-tap-highlight-color:transparent]"
              aria-label={store.name}
            >
              {/* 카테고리 구분은 이모지가 담당 — 테두리는 중립색으로 시각 소음 최소화, 브랜드색은 선택 상태에만 */}
              <span
                className={`flex items-center justify-center rounded-full bg-white transition-transform ${
                  selected
                    ? 'w-10 h-10 text-[19px] scale-110 border-2 border-[#0E4A84] shadow-[0_3px_10px_rgba(14,74,132,0.35)]'
                    : 'w-8 h-8 text-[15px] border border-[#CBD5E1] shadow-[0_2px_6px_rgba(0,0,0,0.18)]'
                }`}
              >
                {store.emoji || CATEGORY_META[store.category].emoji}
              </span>
              {selected && (
                <span className="mt-1 px-2 py-0.5 rounded-full bg-[#0E4A84] text-white text-[11px] font-bold whitespace-nowrap shadow">
                  {store.name}
                </span>
              )}
            </button>
          </CustomOverlayMap>
        );
      })}
    </>
  );
}
