// 제휴탭 지도 화면: 카카오맵 + 카테고리 칩 + 통합 검색 + 바텀시트 + 클러스터링
// SDK 스크립트는 이 컴포넌트가 처음 마운트될 때(제휴탭 최초 진입 시) 로드된다
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { CustomOverlayMap, Map as KakaoMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { LocateFixed, Search } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { measureLocation } from '../../hooks/useLocation.js';
import { CategoryChips } from './CategoryChips';
import { StoreMarkers } from './StoreMarkers';
import { SearchOverlay } from './SearchOverlay';
import { StoreSheet } from './StoreSheet';
import { clusterStores, distanceMeters, type StoreCluster } from './clustering';
import {
  ERICA_MAIN_GATE, STORES, visibleStores, hasCoords, CATEGORY_META,
  type CategoryFilter, type PartnerStore,
} from './storeData';

// 학교 앞 상권이 화면에 꽉 차는 기본 확대 수준 (1=최대 확대)
const DEFAULT_LEVEL = 3;
// 초기 지도 중심: 정문(ERICA_MAIN_GATE)이 아니라 제휴 매장이 밀집한 상권 한가운데.
// 정문 좌표는 '학교 근처인지' 판정 기준으로만 쓰고, 첫 화면은 매장이 보이는 곳에서 시작한다.
const INITIAL_CENTER = { lat: 37.3008, lng: 126.8385 } as const;
// 매장/클러스터 포커스 시 당겨지는 확대 수준 (최대 확대 = 모든 마커 개별 표시)
const FOCUS_LEVEL = 1;
// 선택 시 마커가 검색바 하단 ~ 상세 시트(45%) 상단 사이 정중앙에 오도록
// 지도 중심을 남쪽으로 내리는 위도 오프셋 (FOCUS_LEVEL·시트 높이 기준으로 산출)
const FOCUS_CENTER_LAT_OFFSET = 0.00035;
// 이 거리 밖이면 '학교 근처가 아님'으로 보고 현위치로 센터를 옮기지 않는다
const ERICA_NEARBY_RADIUS_M = 2000;

export default function PartnershipMapView() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JS_KEY,
    // clusterer: 마커 밀집 대비, services: 좌표↔주소 변환 대비
    libraries: ['clusterer', 'services'],
  });
  const posthog = usePostHog();

  // 부드러운 줌/이동은 카카오 imperative API(panTo·setLevel animate)로 제어하므로
  // Map의 center/level prop은 초기값 상수만 넘기고 이후엔 건드리지 않는다
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  // 클러스터링 재계산용 — 사용자 핀치줌·imperative 줌 모두 onZoomChanged로 동기화
  const [level, setLevel] = useState(DEFAULT_LEVEL);

  const [category, setCategory] = useState<CategoryFilter>('all');
  // 단과대 필터 — 예전 리스트 뷰의 기능 승계, 같은 localStorage 키로 이어받는다
  const [college, setCollege] = useState(() => localStorage.getItem('partnerCollegeFilter') || 'all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 클러스터 탭 시 바텀시트에 보여줄 해당 묶음의 매장들
  const [clusterFocus, setClusterFocus] = useState<PartnerStore[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 토스트 자동 숨김
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const selected = useMemo(
    () => STORES.find((s) => s.id === selectedId) ?? null,
    [selectedId]
  );

  // 마커: 칩 필터 + 줌 레벨 기반 클러스터링. 선택된 매장은 강조(링·라벨)만 되고
  // 다른 매장 마커도 그대로 보인다. 칩과 다른 카테고리를 검색으로 선택한 경우엔 풀에 추가.
  const clusters = useMemo<StoreCluster[]>(() => {
    const pool = visibleStores(category, college);
    if (selected && hasCoords(selected) && !pool.some((s) => s.id === selected.id)) {
      pool.push(selected);
    }
    return clusterStores(pool, level);
  }, [selected, category, college, level]);

  // 최대 배율로 부드럽게 당기면서, 시트에 가리지 않는 위치로 센터링
  const focusMap = useCallback((lat: number, lng: number) => {
    if (!map) return;
    const target = new kakao.maps.LatLng(lat - FOCUS_CENTER_LAT_OFFSET, lng);
    map.setLevel(FOCUS_LEVEL, { animate: true, anchor: target });
    map.panTo(target);
  }, [map]);

  const handleCategoryChange = useCallback((next: CategoryFilter) => {
    setCategory(next);
    setSelectedId(null);
    setClusterFocus(null);
    setSheetExpanded(true); // 칩 선택 = 그 카테고리를 둘러보겠다는 의도 → 리스트를 바로 올려준다
    posthog?.capture('partner_map_category_selected', { category: next });
  }, [posthog]);

  const handleCollegeChange = useCallback((next: string) => {
    setCollege(next);
    localStorage.setItem('partnerCollegeFilter', next);
    setSelectedId(null);
    setClusterFocus(null);
    posthog?.capture('partner_map_college_selected', { college: next });
  }, [posthog]);

  // 목록에서 상세로 들어온 경우, X로 닫을 때 펼쳐진 목록으로 복귀시키기 위한 기록
  const returnToList = useRef(false);

  const selectStore = useCallback((store: PartnerStore, source: 'marker' | 'list' | 'search' | 'random') => {
    returnToList.current = source === 'list';
    setSelectedId(store.id);
    setClusterFocus(null);
    setSearchOpen(false);
    setSheetExpanded(false);
    if (store.location.latitude != null && store.location.longitude != null) {
      focusMap(store.location.latitude, store.location.longitude);
    }
    posthog?.capture('partner_map_store_selected', { store_id: store.id, store_name: store.name, source });
  }, [focusMap, posthog]);

  // X로 상세 닫기: 목록에서 들어왔으면 펼쳐진 목록으로 복귀 (배율·센터는 그대로)
  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setSheetExpanded(returnToList.current);
    returnToList.current = false;
  }, []);

  // 지도 빈 곳 탭: 어디서 왔든 지도를 보겠다는 의도 → 시트는 접힌 상태로
  const handleMapClick = useCallback(() => {
    setSelectedId(null);
    setSheetExpanded(false);
    returnToList.current = false;
  }, []);

  // 클러스터 탭: 최대 배율로 당겨 개별 마커로 펼치고, 시트에 해당 매장 리스트를 올린다
  const handleClusterClick = useCallback((cluster: StoreCluster) => {
    setClusterFocus(cluster.stores);
    setSheetExpanded(true);
    focusMap(cluster.lat, cluster.lng);
  }, [focusMap]);

  // 내 위치 버튼: 이 시점에 최초 권한 요청이 일어난다 (진입 즉시 팝업을 띄우지 않기 위함)
  const locateMe = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    posthog?.capture('partner_map_locate_clicked');
    try {
      const pos = await measureLocation();
      setUserPos({ lat: pos.latitude, lng: pos.longitude });
      const distFromCampus = distanceMeters(pos.latitude, pos.longitude, ERICA_MAIN_GATE.lat, ERICA_MAIN_GATE.lng);
      if (distFromCampus <= ERICA_NEARBY_RADIUS_M) {
        map?.panTo(new kakao.maps.LatLng(pos.latitude, pos.longitude));
      } else {
        setToast('학교 근처가 아니라 지도를 이동하지 않았어요');
      }
    } catch {
      setToast('위치를 가져오지 못했어요. 위치 권한을 확인해주세요');
    } finally {
      setLocating(false);
    }
  }, [locating, map, posthog]);

  // 점메추 🎲: 항상 '식당'에서만 랜덤 추천 (점메추/저메추 = 밥 추천이므로 칩과 무관)
  // 직전 선택은 제외해 연속 중복 방지
  const rollRandom = useCallback(() => {
    if (rolling) return;
    const pool = visibleStores('food').filter((s) => s.id !== selectedId);
    if (pool.length === 0) return;
    setRolling(true);
    posthog?.capture('partner_map_random_clicked');
    // 주사위가 잠깐 굴러가는 연출 후 결과 공개
    setTimeout(() => {
      const store = pool[Math.floor(Math.random() * pool.length)];
      selectStore(store, 'random');
      setRolling(false);
    }, 500);
  }, [rolling, selectedId, selectStore, posthog]);

  // 시간대에 따라 버튼이 지금의 고민에 말을 건다: 점심(11~15시) 점메추, 저녁(16~21시) 저메추
  const hour = new Date().getHours();
  const diceLabel = hour >= 11 && hour < 16 ? '점메추' : hour >= 16 && hour < 22 ? '저메추' : '뭐먹지';

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    posthog?.capture('partner_map_search_opened');
  }, [posthog]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-text-hint">
        <span className="text-2xl">🗺️</span>
        <p className="text-sm font-bold">지도를 불러오지 못했어요</p>
        <p className="text-xs">네트워크 연결을 확인해주세요</p>
      </div>
    );
  }

  if (loading) {
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
        onZoomChanged={(m) => setLevel(m.getLevel())}
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
        stores={clusterFocus ?? visibleStores(category, college)}
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
