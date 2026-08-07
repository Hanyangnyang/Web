// 제휴탭 지도 화면: 카카오맵 + 필터 칩(매장 카테고리·건물·흡연장) + 통합 검색 + 바텀시트
// 상태 로직은 usePartnerMap*/usePartnerStore* 훅들이 갖고 있고, 이 컴포넌트는 그것들을
// 조합해 하위 컴포넌트에 내려주는 조립 역할만 한다
import { useCallback, useMemo, useRef, useState } from 'react';
import { CustomOverlayMap, Map as KakaoMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { LocateFixed, Search } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { MapFilterChips, type MapChip } from './MapFilterChips';
import { StoreMarkers } from './StoreMarkers';
import { SearchOverlay } from './SearchOverlay';
import { StoreSheet, STORE_DETAIL_HEIGHT_FRACTION } from './StoreSheet';
import { CampusBuildingMarkers } from './CampusBuildingMarkers';
import { SmokingSpotMarkers } from './SmokingSpotMarkers';
import { CampusBuildingSheet, BUILDING_DETAIL_HEIGHT_FRACTION } from './CampusBuildingSheet';
import { SmokingSpotSheet, SMOKING_DETAIL_HEIGHT_FRACTION } from './SmokingSpotSheet';
import { layoutStores } from './storeLayout';
import {
  hasCoords, visibleStores, CATEGORY_META,
  type CategoryFilter,
} from '../../../domain/entities/PartnerStore.js';
import type { CampusBuilding } from '../../../domain/entities/CampusBuilding.js';
import type { SmokingSpot } from '../../../domain/entities/SmokingSpot.js';
import { usePartnershipStores } from '../../hooks/usePartnershipStores.js';
import { useCampusBuildings } from '../../hooks/useCampusBuildings.js';
import { useSmokingSpots } from '../../hooks/useSmokingSpots.js';
import { usePartnerMapFocus, DEFAULT_LEVEL } from '../../hooks/usePartnerMapFocus.js';
import { usePartnerMapBounds, isWithinBounds } from '../../hooks/usePartnerMapBounds.js';
import { usePartnerMapToast } from '../../hooks/usePartnerMapToast.js';
import { usePartnerMapLocation } from '../../hooks/usePartnerMapLocation.js';
import { usePartnerMapFilters } from '../../hooks/usePartnerMapFilters.js';
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

  const { map, setMap, level, onZoomChanged, focusMap, panTo } = usePartnerMapFocus();
  const { bounds: mapBounds, onIdle } = usePartnerMapBounds(map);
  const { toast, showToast } = usePartnerMapToast();
  const { userPos, locating, locateMe } = usePartnerMapLocation({ panTo, onMessage: showToast, posthog });
  const { chip, setChip, college, setCollege } = usePartnerMapFilters();

  const [searchOpen, setSearchOpen] = useState(false);

  // 지도가 실제로 그려지는 컨테이너의 픽셀 높이 — focusMap이 '시트 제외 영역 정중앙'을 계산할 때 쓴다
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const getViewportHeight = () => mapContainerRef.current?.clientHeight ?? window.innerHeight;

  const isBuildingChip = chip === 'building';
  const isSmokingChip = chip === 'smoking';
  // 매장 카테고리 칩일 때만 매장 관련 데이터를 계산 — 건물/흡연장/미선택 상태에선 null
  const storeCategory: CategoryFilter | null = chip && chip !== 'building' && chip !== 'smoking' ? chip : null;

  // 건물·흡연장은 각자의 칩이 켜졌을 때만 불러온다(RQ enabled)
  const { buildings } = useCampusBuildings({ enabled: isBuildingChip });
  const { spots: smokingSpots } = useSmokingSpots({ enabled: isSmokingChip });

  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [selectedSmokingSpot, setSelectedSmokingSpot] = useState<SmokingSpot | null>(null);

  // focusMap은 시트 종류별로 화면에서 차지하는 높이가 달라 그 비율을 알아야 한다 —
  // 레이어별로 맞는 비율을 미리 발라둔 얇은 래퍼를 만들어 넘긴다.
  const focusMapForStore = useCallback((lat: number, lng: number) => {
    focusMap(lat, lng, STORE_DETAIL_HEIGHT_FRACTION, getViewportHeight());
  }, [focusMap]);

  const {
    selected, selectedId, sheetExpanded, setSheetExpanded,
    selectStore, closeDetail, handleMapClick, browseCategory,
  } = usePartnerStoreSelection({
    stores,
    focusMap: focusMapForStore,
    posthog,
    onAfterSelect: () => setSearchOpen(false),
  });

  // 매장을 선택하면 건물·흡연장 상세는 닫아 하단 시트가 하나만 뜨게 한다
  const pickStore: typeof selectStore = (store, source) => {
    setSelectedBuilding(null);
    setSelectedSmokingSpot(null);
    selectStore(store, source);
  };

  const selectBuilding = (building: CampusBuilding) => {
    closeDetail();
    setSelectedBuilding(building);
    focusMap(building.coordinates.latitude, building.coordinates.longitude, BUILDING_DETAIL_HEIGHT_FRACTION, getViewportHeight());
  };
  const selectSmokingSpot = (spot: SmokingSpot) => {
    closeDetail();
    setSelectedSmokingSpot(spot);
    focusMap(spot.coordinates.latitude, spot.coordinates.longitude, SMOKING_DETAIL_HEIGHT_FRACTION, getViewportHeight());
  };

  // KakaoMap의 onClick prop으로 직접 넘어가므로(useKakaoEvent가 콜백 identity로 리스너를 갈아끼움)
  // 매 렌더 새 함수가 되지 않도록 메모이즈한다
  const handleMapClickAll = useCallback(() => {
    setSelectedBuilding(null);
    setSelectedSmokingSpot(null);
    handleMapClick();
  }, [handleMapClick]);

  const { rolling, rollRandom, diceLabel } = usePartnerRandomPick({
    stores,
    excludeId: selectedId,
    onPick: (store) => pickStore(store, 'random'),
    posthog,
  });

  // 마커: 개수 뱃지로 묶지 않고 항상 전체를 실좌표에 개별 배치(storeLayout). 선택된 매장은 강조만 되고
  // 다른 매장도 그대로 보인다. 칩과 다른 카테고리를 검색으로 선택한 경우엔 풀에 추가.
  const plottedStores = useMemo(() => {
    if (!storeCategory) return [];
    const pool = visibleStores(stores, storeCategory, college);
    if (selected && hasCoords(selected) && !pool.some((s) => s.id === selected.id)) {
      pool.push(selected);
    }
    return layoutStores(pool);
  }, [stores, selected, storeCategory, college]);

  // 화면(뷰포트)에 보이는 건물/흡연장만 하단 리스트에 올린다
  const visibleBuildings = useMemo(() => {
    if (!isBuildingChip || !mapBounds) return [];
    return buildings.filter((b) => isWithinBounds(mapBounds, b.coordinates.latitude, b.coordinates.longitude));
  }, [isBuildingChip, mapBounds, buildings]);

  const visibleSmokingSpots = useMemo(() => {
    if (!isSmokingChip || !mapBounds) return [];
    return smokingSpots.filter((s) => isWithinBounds(mapBounds, s.coordinates.latitude, s.coordinates.longitude));
  }, [isSmokingChip, mapBounds, smokingSpots]);

  // 거리 계산 기준점: '내 위치'를 이미 확인했으면 그 위치, 아니면 지금 보고 있는 화면 중심
  const distanceOrigin = useMemo(() => {
    if (userPos) return userPos;
    if (!mapBounds) return null;
    return { lat: (mapBounds.swLat + mapBounds.neLat) / 2, lng: (mapBounds.swLng + mapBounds.neLng) / 2 };
  }, [userPos, mapBounds]);

  const handleChipChange = (next: MapChip | null) => {
    setChip(next);
    setSelectedBuilding(null);
    setSelectedSmokingSpot(null);
    if (next && next !== 'building' && next !== 'smoking') {
      browseCategory(); // 매장 카테고리 칩 선택 = 선택 해제 + 리스트 펼침
    } else {
      closeDetail(); // 건물/흡연장/선택 해제 → 매장 상세만 닫는다
    }
    posthog?.capture('partner_map_chip_selected', { chip: next });
  };

  // 상세 시트에서도 같은 드롭다운을 쓰므로 선택은 유지한다 (상세 혜택 필터링과 지도 필터가 함께 바뀜)
  const handleCollegeChange = (next: string) => {
    setCollege(next);
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

  // 매장 상세든 건물·흡연장 상세든, 뭔가 상세가 열려 있으면 칩을 숨겨 화면을 단순하게 유지한다
  const anyDetailOpen = !!selected || !!selectedBuilding || !!selectedSmokingSpot;

  return (
    <div ref={mapContainerRef} className="relative h-full overflow-hidden">
      <KakaoMap
        center={INITIAL_CENTER}
        level={DEFAULT_LEVEL}
        onCreate={setMap}
        onZoomChanged={onZoomChanged}
        onIdle={onIdle} // 건물/흡연장 리스트가 참조하는 화면 경계 갱신 (팬·줌이 끝났을 때만)
        onClick={handleMapClickAll} // 마커 바깥(지도 빈 곳) 탭 → 선택 해제 (오버레이 클릭은 map click을 발생시키지 않음)
        style={{ width: '100%', height: '100%' }}
      >
        {storeCategory && (
          <StoreMarkers
            stores={plottedStores}
            level={level}
            selectedId={selectedId}
            onSelectStore={(store) => pickStore(store, 'marker')}
          />
        )}

        {isBuildingChip && (
          <CampusBuildingMarkers
            buildings={buildings}
            level={level}
            selectedId={selectedBuilding?.id ?? null}
            onSelect={selectBuilding}
          />
        )}

        {isSmokingChip && (
          <SmokingSpotMarkers
            spots={smokingSpots}
            level={level}
            selectedId={selectedSmokingSpot?.id ?? null}
            onSelect={selectSmokingSpot}
          />
        )}

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
          anyDetailOpen
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
          anyDetailOpen
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

      {/* 상단: 검색바 + 필터 칩 — 상세 시트가 떠 있어도 칩은 계속 보이게 둔다 */}
      <div className="absolute top-0 inset-x-0 z-10 p-3 space-y-2 pointer-events-none">
        <button
          onClick={openSearch}
          className="pointer-events-auto w-full flex items-center gap-2.5 bg-white rounded-full px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.12)] [-webkit-tap-highlight-color:transparent] active:scale-[0.99] transition-transform"
        >
          <Search size={16} className="text-text-hint flex-shrink-0" />
          <span className="text-[13px] font-semibold text-text-hint">매장명으로 검색</span>
        </button>
        <MapFilterChips value={chip} onChange={handleChipChange} />
      </div>

      {/* 하단: 매장 상세가 열려 있으면 그게 최우선, 아니면 활성 칩에 맞는 시트를 보여준다 */}
      {selected || storeCategory ? (
        <StoreSheet
          stores={storeCategory ? visibleStores(stores, storeCategory, college) : []}
          title={storeCategory ? (storeCategory === 'all' ? '제휴 매장' : `제휴 ${CATEGORY_META[storeCategory].label}`) : ''}
          college={college}
          onCollegeChange={handleCollegeChange}
          resetSignal={`${storeCategory ?? 'none'}:${college}`}
          selected={selected}
          expanded={sheetExpanded}
          onToggleExpand={setSheetExpanded}
          onSelect={(store) => pickStore(store, 'list')}
          onClose={closeDetail}
        />
      ) : isBuildingChip ? (
        <CampusBuildingSheet
          buildings={visibleBuildings}
          origin={distanceOrigin}
          selected={selectedBuilding}
          onSelect={selectBuilding}
          onClose={() => setSelectedBuilding(null)}
        />
      ) : isSmokingChip ? (
        <SmokingSpotSheet
          spots={visibleSmokingSpots}
          origin={distanceOrigin}
          selected={selectedSmokingSpot}
          onSelect={selectSmokingSpot}
          onClose={() => setSelectedSmokingSpot(null)}
        />
      ) : null}

      {/* 검색 오버레이 */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onSelect={(store) => pickStore(store, 'search')}
        />
      )}
    </div>
  );
}
