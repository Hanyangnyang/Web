// 제휴탭 지도 화면: 카카오맵 + 필터 칩(매장 카테고리·건물·흡연장) + 통합 검색 + 바텀시트
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomOverlayMap, Map as KakaoMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { LocateFixed, Search } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { MapFilterChips } from './MapFilterChips';
import { toStoreCategory, type MapChip } from '../../hooks/campusMap/useCampusMapFilters.js';
import { MapStatusScreen } from './MapStatusScreen';
import { StoreMarkers } from './markers/StoreMarkers';
import { SearchOverlay } from './SearchOverlay';
import { StoreSheet } from './sheets/StoreSheet';
import { PointMarkers } from './markers/PointMarkers';
import { CampusBuildingSheet } from './sheets/CampusBuildingSheet';
import { SmokingSpotSheet } from './sheets/SmokingSpotSheet';
import {
  STORE_DETAIL_FRACTION, BUILDING_DETAIL_FRACTION, SMOKING_DETAIL_FRACTION, NAV_CLEARANCE_CSS,
} from './sheets/sheetMetrics';

import {
  hasCoords, visibleStores, CATEGORY_META,
  type CategoryFilter, type PartnerStore,
} from '../../../domain/entities/PartnerStore.js';
import { openSpaceBuildings, type CampusBuilding } from '../../../domain/entities/CampusBuilding.js';
import type { SmokingSpot } from '../../../domain/entities/SmokingSpot.js';
import { usePartnerStores } from '../../hooks/campusMap/usePartnerStores.js';
import { useCampusBuildings } from '../../hooks/campusMap/useCampusBuildings.js';
import { useSmokingSpots } from '../../hooks/campusMap/useSmokingSpots.js';
import { useCampusMapFocus, DEFAULT_LEVEL } from '../../hooks/campusMap/useCampusMapFocus.js';
import { useMapCenter } from '../../hooks/campusMap/useMapCenter.js';
import { getCachedLocation } from '../../hooks/useLocation.js';
import { useCampusMapToast } from '../../hooks/campusMap/useCampusMapToast.js';
import { useCampusMapLocation } from '../../hooks/campusMap/useCampusMapLocation.js';
import { useCampusMapFilters } from '../../hooks/campusMap/useCampusMapFilters.js';
import { useCampusMapLayers } from '../../hooks/campusMap/useCampusMapLayers.js';
import { useCampusMapSelection, selectedBy, type MapSelection, type SelectSource, type StoreSelectSource } from '../../hooks/campusMap/useCampusMapSelection.js';
import { useNearestAutoPick } from '../../hooks/campusMap/useNearestAutoPick.js';
import { usePartnerRandomPick } from '../../hooks/campusMap/usePartnerRandomPick.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { KAKAO_MAP_LIBRARIES } from '../../../lib/kakaoMap';
import { SheetHeightContext, type ReportSheetHeight } from '../ui/sheetHeightContext.js';

// 초기 지도 중심: 정문(ERICA_MAIN_GATE)이 아니라 제휴 매장이 밀집한 상권 한가운데.
// 정문 좌표는 '학교 근처인지' 판정 기준으로만 쓰고(useCampusMapLocation), 첫 화면은 매장이 보이는 곳에서 시작한다.
const INITIAL_CENTER = { lat: 37.3008, lng: 126.8385 } as const;

// 흡연장만 기본 배율보다 한 단계 더 당겨서 본다. 부스·구역이 건물 뒤편이나 주차장 구석처럼
// 몇십 미터 단위로 붙어 있어서, 기본 배율에서는 핀이 겹쳐 보여 "정확히 어디로 가야 하는지"가 안 나온다.
const SMOKING_FOCUS_LEVEL = 2;

interface Props {
  // 탭이 숨겨져도 컴포넌트는 마운트된 채 남아서, 뒤로가기를 가로챌지 판단하려면 이 값이 필요하다
  isActive: boolean;
}

export default function CampusMapView({ isActive }: Props) {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JS_KEY,
    // clusterer: 마커 밀집 대비, services: 좌표↔주소 변환 대비
    // lib/kakaoMap.ts의 prefetchKakaoMapSdk()와 동일한 값이어야 Loader 싱글턴이 재사용된다
    libraries: KAKAO_MAP_LIBRARIES,
  });
  const posthog = usePostHog();
  const { stores, loading: storesLoading, loadErr: storesError } = usePartnerStores();

  const { map, setMap, level, onZoomChanged, focusMap, panTo } = useCampusMapFocus();
  const { center: mapCenter, onIdle } = useMapCenter(map);
  const { toast, showToast } = useCampusMapToast();
  const { userPos, locating, locateMe } = useCampusMapLocation({ panTo, onMessage: showToast, posthog });
  const { chip, setChip, college, setCollege } = useCampusMapFilters();

  const [searchOpen, setSearchOpen] = useState(false);

  // 지도가 실제로 그려지는 컨테이너의 픽셀 높이 — focusMap이 '시트 제외 영역 정중앙'을 계산할 때 쓴다
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const getViewportHeight = useCallback(() => mapContainerRef.current?.clientHeight ?? window.innerHeight, []);

  // 시트가 보고한 높이를 컨테이너의 CSS 변수에 반영한다 — 플로팅 버튼이 이걸 딛고 선다.
  // 상태가 아닌 DOM에 직접 쓰는 이유: 높이 트랜지션 매 프레임마다 마커 수백 개가 리렌더되면 안 된다.
  const reportSheetHeight = useCallback<ReportSheetHeight>((heightPx) => {
    const el = mapContainerRef.current;
    if (!el) return;
    if (heightPx == null) el.style.removeProperty('--sheet-h');
    else el.style.setProperty('--sheet-h', `${heightPx}px`);
  }, []);

  // 칩 하나에서 파생되는 화면 상태(어떤 레이어를 그릴지·어떤 시트를 띄울지)는 전부 이 훅이 계산한다
  const {
    isOpenSpaceChip, isSmokingChip, isBuildingLayerChip,
    showsBuildingLayer, showsSmokingLayer, storeCategory, sheetVisible,
  } = useCampusMapLayers(chip);

  // 건물·흡연장은 각자의 칩이 켜졌을 때만 불러온다(RQ enabled).
  // 로딩·실패는 지도 전체를 막지 않고 해당 시트 안에서만 알린다 — 한 레이어가 실패해도
  // 지도와 나머지 레이어는 계속 쓸 수 있어야 하고, "실패"와 "원래 없음"이 구분돼야 한다.
  const { buildings, loading: buildingsLoading, loadErr: buildingsError } = useCampusBuildings({ enabled: showsBuildingLayer });
  const { spots: smokingSpots, loading: smokingLoading, loadErr: smokingError } = useSmokingSpots({ enabled: showsSmokingLayer });

  // 오픈스페이스 칩이면 오픈스페이스가 있는 건물만 지도·목록에 올린다
  const layerBuildings = useMemo(
    () => (isOpenSpaceChip ? openSpaceBuildings(buildings) : buildings),
    [isOpenSpaceChip, buildings]
  );

  // 선택된 대상으로 지도를 이동시킨다. 종류마다 상세 시트 높이가 달라 센터링 계산이 달라지므로,
  // 세 갈래를 여기 한 곳에 모아두고 훅에는 '언제 부를지'만 맡긴다.
  const focusSelection = useCallback((sel: MapSelection) => {
    const viewportHeight = getViewportHeight();
    switch (sel.kind) {
      case 'store': {
        const coords = sel.store.location.coordinates;
        if (coords) focusMap(coords.latitude, coords.longitude, STORE_DETAIL_FRACTION, viewportHeight);
        break;
      }
      case 'building':
        focusMap(sel.building.coordinates.latitude, sel.building.coordinates.longitude, BUILDING_DETAIL_FRACTION, viewportHeight);
        break;
      case 'smoking':
        focusMap(sel.spot.coordinates.latitude, sel.spot.coordinates.longitude, SMOKING_DETAIL_FRACTION, viewportHeight, SMOKING_FOCUS_LEVEL);
        break;
    }
  }, [focusMap, getViewportHeight]);

  const {
    selection, sheetExpanded, setSheetExpanded,
    selectStore, selectBuilding, selectSmokingSpot,
    closeDetail, clearSelection, browseCategory,
  } = useCampusMapSelection({
    onFocus: focusSelection,
    posthog,
    onAfterSelect: () => setSearchOpen(false),
  });

  // 선택은 id로만 들고 있으므로 매번 최신 목록에서 되살린다 (데이터가 갱신되면 상세도 따라 바뀐다).
  // 건물은 반드시 layerBuildings(오픈스페이스 필터링본)가 아닌 buildings 전체에서 찾아야 한다 —
  // 오픈스페이스 칩 상태에서 검색으로 고른 건물이 그 목록엔 없을 수 있기 때문.
  const selectedStore = useMemo(() => selectedBy(selection, 'store', stores), [selection, stores]);
  const selectedBuilding = useMemo(() => selectedBy(selection, 'building', buildings), [selection, buildings]);
  const selectedSmokingSpot = useMemo(() => selectedBy(selection, 'smoking', smokingSpots), [selection, smokingSpots]);

  // 무엇을 선택하든 그에 해당하는 칩으로 전환한다.
  // '전체'에서 마커를 눌렀을 때 그 종류의 칩이 켜지게 하는 게 주 목적이고, 덕분에
  // "선택된 게 있으면 칩은 '전체'가 아니다"가 보장돼 시트 표시 조건도 단순해진다.
  // (선택끼리의 상호 배제는 useCampusMapSelection이 타입으로 보장하므로 여기선 칩만 신경 쓰면 된다)
  const pickStore = (store: PartnerStore, source: StoreSelectSource) => {
    setChip(store.category);
    selectStore(store, source);
  };

  const pickBuilding = (building: CampusBuilding, source: SelectSource) => {
    // 이미 건물 계열 칩(교내시설/오픈스페이스)이면 그대로 둔다 — 오픈스페이스 탐색 흐름을 끊지 않기 위해
    if (!isBuildingLayerChip) setChip('building');
    selectBuilding(building, source);
  };

  const pickSmokingSpot = (spot: SmokingSpot, source: SelectSource) => {
    if (!isSmokingChip) setChip('smoking');
    selectSmokingSpot(spot, source);
  };

  // 검색에서 건물을 고르면 교내시설 레이어로 확정한다 — 오픈스페이스 칩이 켜져 있어도
  // 검색 결과는 오픈스페이스가 없는 건물일 수 있어서, 그대로 두면 마커가 안 뜬다
  const selectBuildingFromSearch = (building: CampusBuilding) => {
    setChip('building');
    selectBuilding(building, 'search');
  };

  const { rolling, rollRandom, diceLabel } = usePartnerRandomPick({
    stores,
    excludeId: selectedStore?.id ?? null,
    onPick: (store) => pickStore(store, 'random'),
    posthog,
  });

  // 매장 로딩 실패는 StoreSheet 안에서 알리지만, '전체' 칩에서는 시트가 아예 안 뜬다.
  // 그때 마커만 조용히 사라지면 사용자는 원인을 알 수 없으므로 토스트로 한 번 알린다.
  useEffect(() => {
    if (storesError) showToast(storesError);
  }, [storesError, showToast]);

  // 안드로이드 하드웨어 뒤로가기 — 화면에 겹쳐 있는 것을 안쪽부터 하나씩 벗긴다.
  // 순서가 곧 사용자가 쌓아 올린 순서의 역순이다: 검색 → 상세 → 시트.
  // 벗길 게 하나도 없으면 등록하지 않는다. 그래야 안드로이드가 평소대로 앱을 종료할 수 있다.
  // 탭이 숨겨져 있어도(다른 탭 사용 중) 이 컴포넌트는 마운트된 채로 남으므로 isActive를 함께 본다.
  const hasClosableLayer = searchOpen || selection !== null || sheetVisible;
  useBackHandler(() => {
    if (searchOpen) return setSearchOpen(false);
    if (selection) return closeDetail();
    setChip('all'); // 시트를 닫고 '전체' 상태로 (칩 해제와 같은 자리)
  }, isActive && hasClosableLayer);

  // 마커: 개수 뱃지로 묶지 않고 항상 전체를 실좌표에 개별 표시한다. 선택된 매장은 강조만 되고
  // 다른 매장도 그대로 보인다.
  // 선택된 매장은 칩 상태와 무관하게 항상 풀에 넣는다 — 점메추·검색처럼 칩을 거치지 않고
  // 매장이 선택되는 경로가 있어서, 카테고리 칩이 없다고 마커까지 지우면 시트만 뜨고 지도는 빈 화면이 된다.
  // 칩·단과대 필터를 통과한 매장. 지도 마커와 하단 시트가 같은 목록을 보므로 한 번만 계산해
  // 둘이 나눠 쓴다 (예전엔 양쪽에서 각각 visibleStores를 불러, 지도를 드래그해 멈출 때마다
  // — onIdle로 화면 중심이 갱신될 때마다 — 같은 필터가 두 번씩 다시 돌았다).
  // visibleStores가 좌표 없는 매장을 이미 걸러내므로 결과는 전부 PlottableStore다.
  const categoryStores = useMemo(
    () => (storeCategory ? visibleStores(stores, storeCategory, college) : []),
    [stores, storeCategory, college]
  );

  // 선택된 매장이 필터 밖이라도 마커는 보여야 한다 (점메추·검색은 칩을 거치지 않으므로).
  // 얹을 게 없으면 위 배열을 그대로 돌려줘 참조가 불필요하게 새로 생기지 않게 한다.
  const plottedStores = useMemo(() => {
    if (!selectedStore || !hasCoords(selectedStore)) return categoryStores;
    if (categoryStores.some((s) => s.id === selectedStore.id)) return categoryStores;
    return [...categoryStores, selectedStore];
  }, [categoryStores, selectedStore]);

  // 거리 계산·정렬 기준점. 우선순위대로:
  //   1) '내 위치' 버튼으로 방금 측위한 좌표
  //   2) 앱 부팅 때 프리페치된 좌표 (권한이 이미 있는 사용자만 존재 — 여기서 팝업이 뜨지는 않는다)
  //   3) 둘 다 없으면 지금 보고 있는 화면 중심
  // 마운트 시점에 한 번만 읽는다(지연 초기화) — 이후 갱신은 '내 위치' 버튼 경로가 맡는다.
  const [prefetchedPos] = useState(() => {
    const cached = getCachedLocation();
    return cached ? { lat: cached.latitude, lng: cached.longitude } : null;
  });

  const distanceOrigin = useMemo(() => {
    if (userPos) return userPos;
    if (prefetchedPos) return prefetchedPos;
    return mapCenter;
  }, [userPos, prefetchedPos, mapCenter]);

  // 흡연장은 "지금 제일 가까운 데가 어디냐"가 사실상 유일한 질문이라(매장처럼 뭘 파는지 비교할 게 없다),
  // 칩을 켜는 것만으로 가장 가까운 곳이 골라지고 지도가 그리로 이동한다 — 목록 스크롤·마커 탐색을 건너뛴다.
  // 칩을 누른 시점엔 아직 목록이 없을 수 있어(그 칩이 켜져야 조회가 시작된다) 예약해두고 도착 후 실행한다.
  const requestNearestSmoking = useNearestAutoPick({
    items: smokingSpots,
    loading: smokingLoading,
    active: isSmokingChip,
    origin: distanceOrigin,
    onPick: (spot) => pickSmokingSpot(spot, 'nearest'),
  });

  const handleChipChange = (next: MapChip | null) => {
    setChip(next);
    // 칩을 바꾸면 어떤 종류든 선택은 초기화된다 (종류별로 지울 필요 없이 한 번에)
    if (next !== 'all' && toStoreCategory(next)) {
      browseCategory(); // 매장 카테고리 칩 선택 = 선택 해제 + 리스트 펼침
    } else {
      clearSelection(); // '전체'/시설 계열 칩/선택 해제 → 선택만 풀고 리스트는 접어둔다
    }
    if (next === 'smoking') requestNearestSmoking();
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

  // 화면 전체를 막는 건 지도 SDK 자체가 없을 때뿐이다.
  // 매장·건물·흡연장은 어느 하나가 실패해도 지도와 나머지 레이어는 계속 쓸 수 있어야 하므로
  // 각자의 시트 안에서만 알린다 (예전엔 매장만 여기서 전체를 막아, 145KB짜리 매장 JSON이
  // 실패하면 교내시설·흡연장·검색까지 통째로 못 쓰게 됐다).
  if (error) {
    return <MapStatusScreen emoji="🗺️" title="지도를 불러오지 못했어요" description="네트워크 연결을 확인해주세요" />;
  }
  if (loading) {
    return <MapStatusScreen emoji="🗺️" title="지도 불러오는 중…" pulse />;
  }

  // 플로팅 버튼(점메추·내 위치)이 딛고 설 높이.
  const buttonBase = `var(--sheet-h, ${NAV_CLEARANCE_CSS})`;

  return (
    <div ref={mapContainerRef} className="relative h-full overflow-hidden">
      <KakaoMap
        center={INITIAL_CENTER}
        level={DEFAULT_LEVEL}
        onCreate={setMap}
        onZoomChanged={onZoomChanged}
        onIdle={onIdle} // 거리 정렬 기준점(화면 중심) 갱신 — 팬·줌이 끝났을 때만
        onClick={clearSelection} // 마커 바깥(지도 빈 곳) 탭 → 선택 해제 (오버레이 클릭은 map click을 발생시키지 않음)
        style={{ width: '100%', height: '100%' }}
      >
        <StoreMarkers
          stores={plottedStores}
          level={level}
          selectedId={selectedStore?.id ?? null}
          onSelectStore={(store) => pickStore(store, 'marker')}
        />

        {showsBuildingLayer && (
          <PointMarkers
            items={layerBuildings}
            level={level}
            selectedId={selectedBuilding?.id ?? null}
            onSelect={(b) => pickBuilding(b, 'marker')}
          />
        )}

        {showsSmokingLayer && (
          <PointMarkers
            items={smokingSpots}
            level={level}
            selectedId={selectedSmokingSpot?.id ?? null}
            onSelect={(s) => pickSmokingSpot(s, 'marker')}
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

      {/* 점메추 🎲 — 라벨이 곧 설명(항상 식당 랜덤), 내 위치 버튼 위에 스택.
          bottom은 활성 시트 높이에서 파생되므로 Tailwind 클래스가 아닌 inline style로 준다 */}
      <button
        onClick={rollRandom}
        disabled={rolling}
        aria-label="랜덤 식당 추천"
        style={{ bottom: `calc(${buttonBase} + 68px)` }}
        className="absolute right-3 z-30 h-11 px-3.5 flex items-center gap-1.5 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform"
      >
        <span className={`text-[18px] leading-none ${rolling ? 'inline-block animate-spin' : ''}`}>🎲</span>
        <span className="text-[13px] font-extrabold text-[#334155]">{diceLabel}</span>
      </button>

      {/* 내 위치 버튼 — 시트 높이를 따라 항상 시트 가장자리 위에 떠 있는다 */}
      <button
        onClick={locateMe}
        disabled={locating}
        aria-label="내 위치로 이동"
        style={{ bottom: `calc(${buttonBase} + 12px)` }}
        className="absolute right-3 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] [-webkit-tap-highlight-color:transparent] active:scale-95 transition-transform disabled:opacity-60"
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
          <span className="text-[13px] font-semibold text-text-hint">캠퍼스맵 검색</span>
        </button>
        <MapFilterChips value={chip} onChange={handleChipChange} />
      </div>

      {/* 하단: '전체'·미선택이면 시트 없이 지도만, 아니면 활성 칩(또는 열린 상세)에 맞는 시트를 보여준다.
          선택이 일어나면 항상 그 종류의 칩으로 전환되므로, 여기서 '전체'를 걸러도 상세가 가려질 일은 없다.
          Provider: 어떤 시트가 뜨든 자기 높이를 여기로 보고하고, 플로팅 버튼이 그 위에 자리를 잡는다. */}
      <SheetHeightContext.Provider value={reportSheetHeight}>
      {!sheetVisible ? null : selectedStore || storeCategory ? (
        <StoreSheet
          stores={categoryStores}
          loading={storesLoading}
          error={storesError}
          title={storeCategory ? (storeCategory === 'all' ? '제휴 매장' : `제휴 ${CATEGORY_META[storeCategory].label}`) : ''}
          college={college}
          onCollegeChange={handleCollegeChange}
          resetSignal={`${storeCategory ?? 'none'}:${college}`}
          selected={selectedStore}
          expanded={sheetExpanded}
          onToggleExpand={setSheetExpanded}
          onSelect={(store) => pickStore(store, 'list')}
          onClose={closeDetail}
        />
      ) : isBuildingLayerChip ? (
        <CampusBuildingSheet
          buildings={layerBuildings}
          loading={buildingsLoading}
          error={buildingsError}
          origin={distanceOrigin}
          variant={isOpenSpaceChip ? 'openspace' : 'facility'}
          selected={selectedBuilding}
          onSelect={(b) => pickBuilding(b, 'list')}
          onClose={closeDetail}
        />
      ) : isSmokingChip ? (
        <SmokingSpotSheet
          spots={smokingSpots}
          loading={smokingLoading}
          error={smokingError}
          origin={distanceOrigin}
          selected={selectedSmokingSpot}
          onSelect={(s) => pickSmokingSpot(s, 'list')}
          onClose={closeDetail}
        />
      ) : null}
      </SheetHeightContext.Provider>

      {/* 검색 오버레이 */}
      {searchOpen && (
        <SearchOverlay
          onClose={() => setSearchOpen(false)}
          onSelect={(store) => pickStore(store, 'search')}
          onSelectBuilding={selectBuildingFromSearch}
        />
      )}
    </div>
  );
}
