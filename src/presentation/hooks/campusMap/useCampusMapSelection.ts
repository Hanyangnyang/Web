// 훅: 캠퍼스맵에서 '지금 무엇이 선택돼 있는가'
//
// 매장·교내시설·흡연장은 동시에 선택될 수 없다(하단 시트가 하나뿐이므로). 예전엔 셋을 각각
// 별도 state로 두고 하나를 고를 때마다 나머지 둘을 손으로 null 처리했는데, 호출 지점이 늘어날수록
// 한 군데씩 빠뜨려 시트가 겹치거나 마커가 안 뜨는 버그가 반복됐다.
// 판별 유니온 하나로 바꿔 그 규칙을 타입 차원에서 강제한다 — 애초에 둘을 동시에 담을 수 없다.
import { useCallback, useRef, useState } from 'react';
import type { PartnerStore } from '../../../domain/entities/PartnerStore.js';
import type { PlottableBuilding } from '../../../domain/entities/CampusBuilding.js';
import type { PlottableSmokingSpot } from '../../../domain/entities/SmokingSpot.js';

// 선택한 '대상 자체' — 지도 포커스처럼 좌표가 당장 필요한 곳에 넘긴다
export type MapSelection =
  | { kind: 'store'; store: PartnerStore }
  | { kind: 'building'; building: PlottableBuilding }
  | { kind: 'smoking'; spot: PlottableSmokingSpot };

// 상태로 들고 있는 건 종류+id뿐이다. 객체를 통째로 담아두면 그 순간의 스냅샷이 되어,
// 데이터가 갱신(RQ 재요청)돼도 열려 있는 상세 시트는 옛 내용을 계속 보여준다.
// id만 들고 매번 최신 목록에서 찾으면 화면이 항상 현재 데이터를 따라간다.
export interface MapSelectionRef {
  kind: MapSelection['kind'];
  id: string;
}

function toRef(selection: MapSelection): MapSelectionRef {
  switch (selection.kind) {
    case 'store': return { kind: 'store', id: selection.store.id };
    case 'building': return { kind: 'building', id: selection.building.id };
    case 'smoking': return { kind: 'smoking', id: selection.spot.id };
  }
}

// 어디서 선택했는지 — 어느 경로가 실제로 쓰이는지 보려고 계측에 함께 싣는다.
export type SelectSource = 'marker' | 'list' | 'search' | 'nearest';
export type StoreSelectSource = SelectSource | 'random'; // 매장만 점메추(random) 경로가 있다

interface Params {
  // 선택된 대상으로 지도를 이동시킨다. 종류마다 시트 높이가 달라 센터링 계산이 달라지므로
  // '언제 맞출지'는 이 훅이, '어떻게 맞출지'는 호출부가 갖는다.
  onFocus: (selection: MapSelection) => void;
  posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  onAfterSelect?: () => void; // 선택 후 부가 처리 (예: 검색 오버레이 닫기)
}

export function useCampusMapSelection({ onFocus, posthog, onAfterSelect }: Params) {
  const [selection, setSelection] = useState<MapSelectionRef | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // 목록에서 상세로 들어온 경우, X로 닫을 때 펼쳐진 목록으로 복귀시키기 위한 기록
  const returnToList = useRef(false);

  // 포커스는 '지금 이 순간'의 좌표가 필요하니 대상 객체를 그대로 넘기고, 상태로는 참조만 남긴다
  const select = useCallback((next: MapSelection) => {
    setSelection(toRef(next));
    setSheetExpanded(false);
    onFocus(next);
  }, [onFocus]);

  const selectStore = useCallback((store: PartnerStore, source: StoreSelectSource) => {
    returnToList.current = source === 'list';
    select({ kind: 'store', store });
    posthog?.capture('partner_map_store_selected', { store_id: store.id, store_name: store.name, source });
    onAfterSelect?.();
  }, [select, posthog, onAfterSelect]);

  const selectBuilding = useCallback((building: PlottableBuilding, source: SelectSource) => {
    returnToList.current = source === 'list';
    select({ kind: 'building', building });
    posthog?.capture('partner_map_building_selected', {
      building_id: building.id, building_name: building.name, source,
    });
    onAfterSelect?.();
  }, [select, posthog, onAfterSelect]);

  const selectSmokingSpot = useCallback((spot: PlottableSmokingSpot, source: SelectSource) => {
    returnToList.current = source === 'list' || source === 'nearest';
    select({ kind: 'smoking', spot });
    posthog?.capture('partner_map_smoking_selected', {
      spot_id: spot.id, spot_name: spot.name, spot_type: spot.type, source,
    });
    onAfterSelect?.();
  }, [select, posthog, onAfterSelect]);

  // X로 상세 닫기: 목록에서 들어왔으면 펼쳐진 목록으로 복귀 (배율·센터는 그대로)
  const closeDetail = useCallback(() => {
    setSelection(null);
    setSheetExpanded(returnToList.current);
    returnToList.current = false;
  }, []);

  // 지도 빈 곳 탭: 어디서 왔든 지도를 보겠다는 의도 → 시트는 접힌 상태로
  const clearSelection = useCallback(() => {
    setSelection(null);
    setSheetExpanded(false);
    returnToList.current = false;
  }, []);

  // 매장 카테고리 칩 선택 = 그 카테고리를 둘러보겠다는 의도 → 선택 해제하고 리스트를 바로 펼친다
  const browseCategory = useCallback(() => {
    setSelection(null);
    setSheetExpanded(true);
    returnToList.current = false;
  }, []);

  return {
    selection,
    sheetExpanded,
    setSheetExpanded,
    selectStore,
    selectBuilding,
    selectSmokingSpot,
    closeDetail,
    clearSelection,
    browseCategory,
  };
}

/**
 * 선택 참조를 실제 대상으로 되살린다 — 항상 최신 목록에서 찾으므로 데이터가 갱신되면 화면도 따라간다.
 * 목록은 반드시 '필터링 전 전체'를 넘겨야 한다. 예컨대 오픈스페이스 칩이 걸린 상태에서
 * 오픈스페이스가 없는 건물이 선택될 수 있는데, 걸러진 목록을 넘기면 그 선택이 사라진다.
 */
export function selectedBy<T extends { id: string }>(
  selection: MapSelectionRef | null,
  kind: MapSelection['kind'],
  items: T[],
): T | null {
  if (selection?.kind !== kind) return null;
  return items.find((item) => item.id === selection.id) ?? null;
}
