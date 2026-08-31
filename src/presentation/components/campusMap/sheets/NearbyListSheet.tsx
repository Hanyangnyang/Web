// 교내시설·흡연장 목록 시트의 공통 껍데기
import { ChevronRight } from 'lucide-react';
import { StandardBottomSheet } from '../../ui/StandardBottomSheet.js';
import { NAV_CLEARANCE_CLASS, LIST_COLLAPSED_CSS } from './sheetMetrics';
import { SheetHandle } from './SheetHandle';
import { formatDistance, sortByDistance, type LatLng } from '../../../../lib/campusGeo.js';
import type { Coordinates } from '../../../../domain/entities/Coordinates.js';

// 항목이 id와 coordinates를 갖는다는 것만 제약하면, 키·좌표를 꺼내는 함수를 따로 받을 필요가 없다
export interface NearbyListSheetProps<T extends { id: string; coordinates: Coordinates }> {
  items: T[];
  loading: boolean;
  error: string | null;
  origin: LatLng | null;              // 거리 기준점 (내 위치 → 프리페치 좌표 → 화면 중심)
  height: string;                     // 펼쳤을 때 시트 높이 (CSS 길이). 접히면 한 줄만 남는다
  expanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  emoji: string;
  title: string;                      // 예: '교내시설'
  // 헤더에 표시할 개수. 목록 행 수와 다를 수 있어 따로 받는다 —
  // 오픈스페이스는 건물이 아니라 그 안의 공간을 센다(건물 10곳에 공간 13개). 없으면 행 수를 쓴다.
  count?: number;
  countColorClass: string;            // 개수 강조 색 (레이어별로 다름)
  emptyText: string;                  // 조사(이/가) 때문에 문장을 통째로 받는다
  renderLabel: (item: T) => React.ReactNode;  // 행의 이름/부제 영역
  renderBadge?: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
}

export function NearbyListSheet<T extends { id: string; coordinates: Coordinates }>({
  items, loading, error, origin, height, expanded, onToggleExpand,
  emoji, title, count, countColorClass, emptyText,
  renderLabel, renderBadge, onSelect,
}: NearbyListSheetProps<T>) {
  const rows = sortByDistance(items, origin, (item) => item.coordinates);

  return (
    <StandardBottomSheet height={expanded ? height : LIST_COLLAPSED_CSS}>
      <SheetHandle
        expanded={expanded}
        onToggleExpand={onToggleExpand}
        className="border-b border-[#f1f5f9]"
      >
        <div className="flex items-baseline justify-between gap-2">
          {/* 타이틀도 눌러서 접었다 펼 수 있게 — 손잡이만 정확히 집기엔 너무 얇다 */}
          <button
            className="text-left text-[13px] font-extrabold text-text-main [-webkit-tap-highlight-color:transparent]"
            onClick={() => onToggleExpand(!expanded)}
          >
            <span className="mr-1 text-[15px]">{emoji}</span>
            {title} <span className={countColorClass}>{count ?? items.length}</span>곳
          </button>
          {origin && <span className="flex-shrink-0 text-[11px] font-bold text-text-hint">가까운 순</span>}
        </div>
      </SheetHandle>

      <div className={`flex-1 overflow-y-auto ${NAV_CLEARANCE_CLASS}`}>
        {/* 실패·로딩·빈 목록은 서로 다른 상황이라 문구도 구분한다 */}
        {error ? (
          <p className="text-center text-[12px] text-red-500 font-medium pt-6">{error}</p>
        ) : loading ? (
          <p className="text-center text-[12px] text-text-hint font-medium pt-6 animate-pulse">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-[12px] text-text-hint font-medium pt-6">{emptyText}</p>
        ) : null}

        {rows.map(({ item, distance }, idx) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 [-webkit-tap-highlight-color:transparent] ${
              idx > 0 ? 'border-t border-[#f1f5f9]' : ''
            }`}
          >
            <div className="flex-1 min-w-0">{renderLabel(item)}</div>
            {renderBadge?.(item)}
            {distance != null && (
              <span className="flex-shrink-0 text-[11px] font-bold text-text-hint">{formatDistance(distance)}</span>
            )}
            <ChevronRight size={16} className="flex-shrink-0 text-text-hint" />
          </button>
        ))}
      </div>
    </StandardBottomSheet>
  );
}
