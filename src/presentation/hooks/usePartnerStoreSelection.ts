// 훅: 캠퍼스맵 매장 선택 상태 — 개별 매장 선택과 바텀시트 펼침/접힘
// 이 둘은 서로 얽혀있어(선택 시 시트 접힘 등) 하나의 훅으로 묶는다
import { useCallback, useMemo, useRef, useState } from 'react';
import type { PartnerStore } from '../../domain/entities/PartnerStore.js';

type SelectSource = 'marker' | 'list' | 'search' | 'random';

interface Params {
  stores: PartnerStore[];
  focusMap: (lat: number, lng: number) => void;
  posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  onAfterSelect?: () => void; // 선택 후 부가 처리 (예: 검색 오버레이 닫기)
}

export function usePartnerStoreSelection({ stores, focusMap, posthog, onAfterSelect }: Params) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // 목록에서 상세로 들어온 경우, X로 닫을 때 펼쳐진 목록으로 복귀시키기 위한 기록
  const returnToList = useRef(false);

  const selected = useMemo(
    () => stores.find((s) => s.id === selectedId) ?? null,
    [stores, selectedId]
  );

  const selectStore = useCallback((store: PartnerStore, source: SelectSource) => {
    returnToList.current = source === 'list';
    setSelectedId(store.id);
    setSheetExpanded(false);
    if (store.location.latitude != null && store.location.longitude != null) {
      focusMap(store.location.latitude, store.location.longitude);
    }
    posthog?.capture('partner_map_store_selected', { store_id: store.id, store_name: store.name, source });
    onAfterSelect?.();
  }, [focusMap, posthog, onAfterSelect]);

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

  // 필터 칩 선택 = 그 카테고리를 둘러보겠다는 의도 → 선택 해제하고 리스트를 바로 펼친다
  const browseCategory = useCallback(() => {
    setSelectedId(null);
    setSheetExpanded(true);
  }, []);

  return {
    selected,
    selectedId,
    sheetExpanded,
    setSheetExpanded,
    selectStore,
    closeDetail,
    handleMapClick,
    browseCategory,
  };
}
