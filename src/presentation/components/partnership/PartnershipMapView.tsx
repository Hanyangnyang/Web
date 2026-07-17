// 제휴탭 지도 화면: 카카오맵 + 카테고리 칩 + 통합 검색 + 바텀시트
// SDK 스크립트는 이 컴포넌트가 처음 마운트될 때(제휴탭 최초 진입 시) 로드된다
import { useMemo, useState, useCallback } from 'react';
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk';
import { Search } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { CategoryChips } from './CategoryChips';
import { StoreMarkers } from './StoreMarkers';
import { SearchOverlay } from './SearchOverlay';
import { StoreSheet } from './StoreSheet';
import {
  STORES, ERICA_MAIN_GATE, visibleStores, hasCoords,
  type CategoryFilter, type PartnerStore,
} from './storeData';

// 학교 앞 상권이 한눈에 들어오는 확대 수준 (1=최대 확대)
const DEFAULT_LEVEL = 4;

export default function PartnershipMapView() {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_JS_KEY,
    // clusterer: 마커 밀집 대비, services: 좌표↔주소 변환 대비
    libraries: ['clusterer', 'services'],
  });
  const posthog = usePostHog();

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(ERICA_MAIN_GATE);

  const selected = useMemo(
    () => STORES.find((s) => s.id === selectedId) ?? null,
    [selectedId]
  );

  // 마커 대상: 현재 칩 기준 + 선택된 매장은 칩과 무관하게 항상 표시 (검색으로 선택한 경우)
  const markerStores = useMemo(() => {
    const list = visibleStores(category);
    if (selected && hasCoords(selected) && !list.some((s) => s.id === selected.id)) {
      return [...list, selected];
    }
    return list;
  }, [category, selected]);

  const handleCategoryChange = useCallback((next: CategoryFilter) => {
    setCategory(next);
    setSelectedId(null);
    posthog?.capture('partner_map_category_selected', { category: next });
  }, [posthog]);

  const selectStore = useCallback((store: PartnerStore, source: 'marker' | 'list' | 'search') => {
    setSelectedId(store.id);
    setSearchOpen(false);
    setSheetExpanded(false);
    if (store.location.latitude != null && store.location.longitude != null) {
      setCenter({ lat: store.location.latitude, lng: store.location.longitude });
    }
    posthog?.capture('partner_map_store_selected', { store_id: store.id, store_name: store.name, source });
  }, [posthog]);

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
      <Map
        center={center}
        isPanto
        level={DEFAULT_LEVEL}
        style={{ width: '100%', height: '100%' }}
      >
        <StoreMarkers
          stores={markerStores}
          selectedId={selectedId}
          onSelect={(store) => selectStore(store, 'marker')}
        />
      </Map>

      {/* 상단: 검색바 + 카테고리 칩 */}
      <div className="absolute top-0 inset-x-0 z-10 p-3 space-y-2 pointer-events-none">
        <button
          onClick={openSearch}
          className="pointer-events-auto w-full flex items-center gap-2.5 bg-white rounded-full px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.12)] [-webkit-tap-highlight-color:transparent] active:scale-[0.99] transition-transform"
        >
          <Search size={16} className="text-text-hint flex-shrink-0" />
          <span className="text-[13px] font-semibold text-text-hint">매장명으로 검색</span>
        </button>
        <CategoryChips value={category} onChange={handleCategoryChange} />
      </div>

      {/* 하단: 매장 리스트 / 상세 바텀시트 */}
      <StoreSheet
        stores={visibleStores(category)}
        selected={selected}
        expanded={sheetExpanded}
        onToggleExpand={setSheetExpanded}
        onSelect={(store) => selectStore(store, 'list')}
        onClose={() => setSelectedId(null)}
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
