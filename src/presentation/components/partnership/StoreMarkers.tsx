// 지도 위 마커 렌더링
// - 1개짜리 클러스터 → 개별 매장 마커 (이모지)
// - 여러 개 클러스터 → 개수 원 (탭하면 한 단계 확대)
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { CATEGORY_META, type PartnerStore } from './storeData';
import type { StoreCluster } from './clustering';

interface Props {
  clusters: StoreCluster[];
  level: number;                   // 현재 줌 레벨 — 원형/개별 마커 전환 기준
  selectedId: string | null;
  onSelectStore: (store: PartnerStore) => void;
  onSelectCluster: (cluster: StoreCluster) => void;
}

// 이 레벨 이하(충분히 가까움)일 때만 이모지 개별 마커를 보여주고,
// 그보다 멀면 단독 매장도 "1" 원으로 표시한다
const INDIVIDUAL_MARKER_MAX_LEVEL = 2;

function clusterSizeClass(count: number): string {
  if (count >= 20) return 'w-12 h-12 text-[15px]';
  if (count >= 8) return 'w-11 h-11 text-[14px]';
  return 'w-9 h-9 text-[13px]';
}

export function StoreMarkers({ clusters, level, selectedId, onSelectStore, onSelectCluster }: Props) {
  return (
    <>
      {clusters.map((cluster) => {
        // ── 원형 마커: 여러 매장 묶음이거나, 아직 먼 배율의 단독 매장 ──
        // 선택된 매장만은 배율과 무관하게 항상 개별 마커로 강조한다
        const single = cluster.stores.length === 1;
        const isSelected = single && cluster.stores[0].id === selectedId;
        const asCircle = !isSelected && (!single || level > INDIVIDUAL_MARKER_MAX_LEVEL);

        if (asCircle) {
          return (
            <CustomOverlayMap
              key={`cluster-${cluster.stores[0].id}-${cluster.stores.length}`}
              position={{ lat: cluster.lat, lng: cluster.lng }}
              yAnchor={0.5}
              zIndex={5}
            >
              <button
                onClick={() => (single ? onSelectStore(cluster.stores[0]) : onSelectCluster(cluster))}
                aria-label={single ? cluster.stores[0].name : `매장 ${cluster.stores.length}곳 묶음`}
                className={`flex items-center justify-center rounded-full bg-[#F1F5F9]/95 text-[#0E4A84] font-extrabold shadow-[0_3px_10px_rgba(0,0,0,0.22)] border border-[#CBD5E1] [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform ${clusterSizeClass(cluster.stores.length)}`}
              >
                {cluster.stores.length}
              </button>
            </CustomOverlayMap>
          );
        }

        // ── 개별 매장 마커 ──
        // 위치는 cluster 좌표 사용: 동일 건물 매장들을 부채꼴로 펼친 좌표가 반영돼 있다
        const store = cluster.stores[0];
        const selected = store.id === selectedId;

        return (
          <CustomOverlayMap
            key={store.id}
            position={{ lat: cluster.lat, lng: cluster.lng }}
            yAnchor={0.5}
            zIndex={selected ? 20 : 1}
          >
            <button
              onClick={() => onSelectStore(store)}
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
