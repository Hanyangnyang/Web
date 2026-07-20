// 지도 위 마커 렌더링
// - 1개짜리 클러스터 → 개별 매장 마커 (이모지)
// - 여러 개 클러스터 → 개수 원 (탭하면 한 단계 확대)
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { CATEGORY_META, type PartnerStore } from './storeData';
import type { StoreCluster } from './clustering';

interface Props {
  clusters: StoreCluster[];
  level: number;                   // 현재 줌 레벨 — 원형/개별 마커 전환, 이름표 상시 표시 기준
  selectedId: string | null;
  onSelectStore: (store: PartnerStore) => void;
  onSelectCluster: (cluster: StoreCluster) => void;
}

// 이 레벨 이하(충분히 가까움)일 때만 이모지 개별 마커를 보여주고,
// 그보다 멀면 단독 매장도 "1" 원으로 표시한다
const INDIVIDUAL_MARKER_MAX_LEVEL = 2;

// 이 레벨 이하(최대 확대)에서는 선택 여부와 무관하게 이름을 상시 표시한다.
// clustering.ts의 NO_CLUSTER_LEVEL과 값을 맞춘다 — 마커가 겹침 없이 펼쳐진 상태라야 이름표도 안 겹친다.
const LABEL_VISIBLE_MAX_LEVEL = 1;

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
              {/* 너비 0 컨테이너 + flex 중앙정렬: 내용 크기가 몇 px든 항상 이 지점(zero-width center)을 기준으로
                  좌우 대칭 렌더링되므로, Kakao의 앵커 계산 방식과 무관하게 시각적 중심이 좌표에 고정된다 */}
              <div style={{ width: 0 }} className="flex justify-center">
                <button
                  onClick={() => (single ? onSelectStore(cluster.stores[0]) : onSelectCluster(cluster))}
                  aria-label={single ? cluster.stores[0].name : `매장 ${cluster.stores.length}곳 묶음`}
                  className="flex items-center justify-center p-2 [-webkit-tap-highlight-color:transparent]"
                >
                  <span
                    className={`flex items-center justify-center rounded-full bg-[#F1F5F9]/95 text-[#0E4A84] font-extrabold shadow-[0_3px_10px_rgba(0,0,0,0.22)] border border-[#CBD5E1] transition-transform active:scale-95 ${clusterSizeClass(cluster.stores.length)}`}
                  >
                    {cluster.stores.length}
                  </span>
                </button>
              </div>
            </CustomOverlayMap>
          );
        }

        // ── 개별 매장 마커 ──
        // 위치는 cluster 좌표 사용: 동일 건물 매장들을 부채꼴로 펼친 좌표가 반영돼 있다
        const store = cluster.stores[0];
        const selected = store.id === selectedId;

        return (
          <>
            {/* 원(클릭 대상): 너비 0 컨테이너 + flex 중앙정렬로 선택 시 원 크기가 32→40px로 커져도
                항상 좌표 지점을 기준으로 좌우 대칭 렌더링되어 시각적 중심이 흔들리지 않는다.
                라벨을 이 안에 같이 넣으면(선택 시 높이가 늘어나) 박스 전체 중심이 기준이 되면서
                원이 좌표에서 벗어나 보이므로, 라벨은 아래에 별도 오버레이로 분리한다. */}
            <CustomOverlayMap
              key={store.id}
              position={{ lat: cluster.lat, lng: cluster.lng }}
              yAnchor={0.5}
              zIndex={selected ? 20 : 1}
            >
              <div style={{ width: 0 }} className="flex justify-center">
                {/* 바깥 버튼에 여백을 줘 시각 크기보다 넓은 히트 영역을 확보 (여백이 대칭이라 앵커는 그대로 원 중심) */}
                <button
                  onClick={() => onSelectStore(store)}
                  aria-label={store.name}
                  className="flex items-center justify-center p-2 [-webkit-tap-highlight-color:transparent]"
                >
                  <span
                    className={`flex items-center justify-center rounded-full bg-white transition-transform ${
                      selected
                        ? 'w-10 h-10 text-[19px] scale-110 border-2 border-[#0E4A84] shadow-[0_3px_10px_rgba(14,74,132,0.35)]'
                        : 'w-8 h-8 text-[15px] border border-[#CBD5E1] shadow-[0_2px_6px_rgba(0,0,0,0.18)]'
                    }`}
                  >
                    {store.emoji || CATEGORY_META[store.category].emoji}
                  </span>
                </button>
              </div>
            </CustomOverlayMap>

            {/* 이름 라벨: 같은 좌표에 별도 오버레이로 얹어 원의 앵커에는 영향을 주지 않는다.
                선택 시엔 강조색 반투명 알약, 최대 확대 시엔 선택 여부와 무관하게 보조 알약을 보여준다. */}
            {(selected || level <= LABEL_VISIBLE_MAX_LEVEL) && (
              <CustomOverlayMap
                key={`${store.id}-label`}
                position={{ lat: cluster.lat, lng: cluster.lng }}
                xAnchor={0.5}
                yAnchor={0}
                zIndex={selected ? 21 : 4}
              >
                {/* margin-top = 원 반지름 그대로 — 원 아래 테두리에 알약 윗변이 딱 맞닿는다 (선택 시 40px/평소 32px)
                    이름 라벨도 원과 별개의 클릭 영역으로 — 매장명을 눌러도 선택되게 한다.
                    너비 0 컨테이너 + flex 중앙정렬: 매장명 글자 수가 제각각이라도 항상 좌표 지점을 기준으로
                    좌우 대칭 렌더링되어 원과 정확히 같은 수직선에 정렬된다 */}
                <div style={{ width: 0 }} className={`flex justify-center ${selected ? 'mt-5' : 'mt-4'}`}>
                  <button
                    onClick={() => onSelectStore(store)}
                    aria-label={store.name}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow-sm backdrop-blur-[2px] active:scale-95 transition-transform [-webkit-tap-highlight-color:transparent] ${
                      selected
                        ? 'bg-[#0E4A84]/75 text-white'
                        : 'bg-white/70 text-[#334155] border border-[#e2e8f0]/70'
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
