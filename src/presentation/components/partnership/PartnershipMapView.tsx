// 제휴탭 지도 화면: 카카오맵 + 카테고리 칩 + 통합 검색 + 바텀시트 + 클러스터링
// 상태 로직은 usePartnerMap*/usePartnerStore* 훅들이 갖고 있고, 이 컴포넌트는 그것들을
// 조합해 하위 컴포넌트에 내려주는 조립 역할만 한다
import { useMemo, useState } from 'react';
import { CustomOverlayMap, Map as KakaoMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { LocateFixed, Search } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { CategoryChips } from './CategoryChips';
import { StoreMarkers } from './StoreMarkers';
import { SearchOverlay } from './SearchOverlay';
import { StoreSheet } from './StoreSheet';
import { clusterStores, type StoreCluster } from './clustering';
import {
  hasCoords, visibleStores, CATEGORY_META,
  type CategoryFilter,
} from '../../../domain/entities/PartnerStore.js';
import { usePartnershipStores } from '../../hooks/usePartnershipStores.js';
import { usePartnerMapFocus, DEFAULT_LEVEL } from '../../hooks/usePartnerMapFocus.js';
import { usePartnerMapToast } from '../../hooks/usePartnerMapToast.js';
import { usePartnerMapLocation } from '../../hooks/usePartnerMapLocation.js';
import { usePartnerStoreFilters } from '../../hooks/usePartnerStoreFilters.js';
import { usePartnerStoreSelection } from '../../hooks/usePartnerStoreSelection.js';
import { usePartnerRandomPick } from '../../hooks/usePartnerRandomPick.js';
import { KAKAO_MAP_LIBRARIES } from '../../../lib/kakaoMap';

// 초기 지도 중심: 정문(ERICA_MAIN_GATE)이 아니라 제휴 매장이 밀집한 상권 한가운데.
// 정문 좌표는 '학교 근처인지' 판정 기준으로만 쓰고(usePartnerMapLocation), 첫 화면은 매장이 보이는 곳에서 시작한다.
const INITIAL_CENTER = { lat: 37.3008, lng: 126.8385 } as const;

export default function PartnershipMapView() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JS_KEY,
    // clusterer: 마커 밀집 대비, services: 좌표↔주소 변환 대비
    // lib/kakaoMap.ts의 prefetchKakaoMapSdk()와 동일한 값이어야 Loader 싱글턴이 재사용된다
    libraries: KAKAO_MAP_LIBRARIES,
  });
  const posthog = usePostHog();
  const { stores, loading: storesLoading, loadErr: storesError } = usePartnershipStores();

  const { setMap, level, onZoomChanged, focusMap, panTo } = usePartnerMapFocus();
  const { toast, showToast } = usePartnerMapToast();
  const { userPos, locating, locateMe } = usePartnerMapLocation({ panTo, onMessage: showToast, posthog });
  const { category, setCategory, college, setCollege } = usePartnerStoreFilters();

  const [searchOpen, setSearchOpen] = useState(false);

  const {
    selected, selectedId, clusterFocus, setClusterFocus, sheetExpanded, setSheetExpanded,
    selectStore, closeDetail, handleMapClick, handleClusterClick, browseCategory,
  } = usePartnerStoreSelection({
    stores,
    focusMap,
    posthog,
    onAfterSelect: () => setSearchOpen(false),
  });

  const { rolling, rollRandom, diceLabel } = usePartnerRandomPick({
    stores,
    excludeId: selectedId,
    onPick: (store) => selectStore(store, 'random'),
    posthog,
  });

  // 마커: 칩 필터 + 줌 레벨 기반 클러스터링. 선택된 매장은 강조(링·라벨)만 되고
  // 다른 매장 마커도 그대로 보인다. 칩과 다른 카테고리를 검색으로 선택한 경우엔 풀에 추가.
  const clusters = useMemo<StoreCluster[]>(() => {
    const pool = visibleStores(stores, category, college);
    if (selected && hasCoords(selected) && !pool.some((s) => s.id === selected.id)) {
      pool.push(selected);
    }
    return clusterStores(pool, level);
  }, [stores, selected, category, college, level]);

  const handleCategoryChange = (next: CategoryFilter) => {
    setCategory(next);
    browseCategory(); // 칩 선택 = 그 카테고리를 둘러보겠다는 의도 → 선택 해제 + 리스트 펼침
    posthog?.capture('partner_map_category_selected', { category: next });
  };

  // 상세 시트에서도 같은 드롭다운을 쓰므로 선택은 유지한다 (상세 혜택 필터링과 지도 필터가 함께 바뀜)
  const handleCollegeChange = (next: string) => {
    setCollege(next);
    setClusterFocus(null);
    posthog?.capture('partner_map_college_selected', { college: next });
  };

  const openSearch = () => {
    setSearchOpen(true);
    posthog?.capture('partner_map_search_opened');
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-text-hint">
        <span className="text-2xl">🗺️</span>
        <p className="text-sm font-bold">지도를 불러오지 못했어요</p>
        <p className="text-xs">네트워크 연결을 확인해주세요</p>
      </div>
    );
  }

  // 매장 데이터 로딩 실패 — 지도 SDK 에러와 별개 축이라 메시지도 구분
  if (storesError) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-text-hint">
        <span className="text-2xl">🏪</span>
        <p className="text-sm font-bold">매장 정보를 불러오지 못했어요</p>
        <p className="text-xs">네트워크 연결을 확인해주세요</p>
      </div>
    );
  }

  if (loading || storesLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <span className="text-sm font-bold text-text-hint animate-pulse">지도 불러오는 중…</span>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      <KakaoMap
        center={INITIAL_CENTER}
        level={DEFAULT_LEVEL}
        onCreate={setMap}
        onZoomChanged={onZoomChanged}
        onClick={handleMapClick} // 마커 바깥(지도 빈 곳) 탭 → 선택 해제 (오버레이 클릭은 map click을 발생시키지 않음)
        style={{ width: '100%', height: '100%' }}
      >
        <StoreMarkers
          clusters={clusters}
          level={level}
          selectedId={selectedId}
          onSelectStore={(store) => selectStore(store, 'marker')}
          onSelectCluster={handleClusterClick}
        />

        {/* 현재 위치 파란 점 (+ 펄스) */}
        {userPos && (
          <CustomOverlayMap position={userPos} yAnchor={0.5} zIndex={30}>
            <div className="relative pointer-events-none" aria-label="내 위치">
              <span className="absolute inset-0 rounded-full bg-[#3B82F6]/40 animate-ping" />
              <span className="relative block w-4 h-4 rounded-full bg-[#3B82F6] border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.3)]" />
            </div>
          </CustomOverlayMap>
        )}
      </KakaoMap>

      {/* 점메추 🎲 — 라벨이 곧 설명(항상 식당 랜덤), 내 위치 버튼 위에 스택 */}
      <button
        onClick={rollRandom}
        disabled={rolling}
        aria-label="랜덤 식당 추천"
        className={`absolute right-3 z-30 h-11 px-3.5 flex items-center gap-1.5 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] [-webkit-tap-highlight-color:transparent] active:scale-95 transition-[bottom,transform] duration-300 ease-out ${
          selected
            ? 'bottom-[calc(45%+68px)]'
            : sheetExpanded
              ? 'bottom-[calc(52%+68px)]'
              : 'bottom-[calc(236px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <span className={`text-[18px] leading-none ${rolling ? 'inline-block animate-spin' : ''}`}>🎲</span>
        <span className="text-[13px] font-extrabold text-[#334155]">{diceLabel}</span>
      </button>

      {/* 내 위치 버튼 — 시트 높이를 따라 항상 시트 가장자리 위에 떠 있는다 */}
      <button
        onClick={locateMe}
        disabled={locating}
        aria-label="내 위치로 이동"
        className={`absolute right-3 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] [-webkit-tap-highlight-color:transparent] active:scale-95 transition-[bottom,transform] duration-300 ease-out disabled:opacity-60 ${
          selected
            ? 'bottom-[calc(45%+12px)]'
            : sheetExpanded
              ? 'bottom-[calc(52%+12px)]'
              : 'bottom-[calc(180px+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <LocateFixed size={19} className={locating ? 'text-text-hint animate-pulse' : 'text-[#334155]'} />
      </button>

      {/* 토스트 */}
      {toast && (
        <div className="absolute top-[120px] inset-x-0 z-40 flex justify-center pointer-events-none">
          <span className="px-4 py-2 rounded-full bg-[rgba(15,23,42,0.85)] text-white text-[12px] font-bold shadow-lg">
            {toast}
          </span>
        </div>
      )}

      {/* 상단: 검색바 + 카테고리 칩 (선택 중엔 칩 숨김 — 단독 마커 상태라 필터가 무의미하고 카테고리 혼동 방지) */}
      <div className="absolute top-0 inset-x-0 z-10 p-3 space-y-2 pointer-events-none">
        <button
          onClick={openSearch}
          className="pointer-events-auto w-full flex items-center gap-2.5 bg-white rounded-full px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.12)] [-webkit-tap-highlight-color:transparent] active:scale-[0.99] transition-transform"
        >
          <Search size={16} className="text-text-hint flex-shrink-0" />
          <span className="text-[13px] font-semibold text-text-hint">매장명으로 검색</span>
        </button>
        {!selected && <CategoryChips value={category} onChange={handleCategoryChange} />}
      </div>

      {/* 하단: 매장 리스트 / 상세 바텀시트 */}
      <StoreSheet
        stores={clusterFocus ?? visibleStores(stores, category, college)}
        title={
          clusterFocus
            ? '이 위치 제휴 매장'
            : category === 'all' ? '제휴 매장' : `제휴 ${CATEGORY_META[category].label}`
        }
        college={college}
        onCollegeChange={handleCollegeChange}
        resetSignal={`${category}:${college}`}
        selected={selected}
        expanded={sheetExpanded}
        onToggleExpand={setSheetExpanded}
        onSelect={(store) => selectStore(store, 'list')}
        onClose={closeDetail}
      />

      {/* 검색 오버레이 */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onSelect={(store) => selectStore(store, 'search')}
        />
      )}
    </div>
  );
}
