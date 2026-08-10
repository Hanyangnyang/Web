// 교내시설·흡연장 목록 시트의 공통 껍데기.
// 둘 다 "기준점에서 가까운 순으로 나열하고, 각 행에 거리를 보여준다"는 구조가 같아서
// 항목 타입만 다른 채로 50줄씩 복붙돼 있었다. 다른 건 행 안의 텍스트뿐이라 그것만 주입받는다.
import { ChevronRight } from 'lucide-react';
import { StandardBottomSheet } from '../ui/StandardBottomSheet.js';
import { NAV_CLEARANCE_CLASS } from './sheetHeights';
import { formatDistance, sortByDistance, type LatLng } from '../../../lib/geo.js';
import type { Coordinates } from '../../../domain/entities/Coordinates.js';

// 항목이 id와 coordinates를 갖는다는 것만 제약하면, 키·좌표를 꺼내는 함수를 따로 받을 필요가 없다
export interface NearbyListSheetProps<T extends { id: string; coordinates: Coordinates }> {
  items: T[];
  loading: boolean;
  error: string | null;
  origin: LatLng | null;              // 거리 기준점 (내 위치 → 프리페치 좌표 → 화면 중심)
  height: string;                     // 시트 높이 (CSS 길이)
  // 헤더 제목 앞에 붙는 레이어 상징 이모지. 행마다 반복하면 51줄 내내 같은 아이콘이 세로로 늘어서서
  // 정작 이름을 밀어낼 뿐 아무것도 구분해주지 못하므로, 목록 전체를 대표하는 자리에만 한 번 둔다.
  emoji: string;
  title: string;                      // 예: '교내시설'
  countColorClass: string;            // 개수 강조 색 (레이어별로 다름)
  emptyText: string;                  // 조사(이/가) 때문에 문장을 통째로 받는다
  renderLabel: (item: T) => React.ReactNode;  // 행의 이름/부제 영역
  // 거리 앞에 붙일 배지. 레이어마다 강조할 게 달라 판단은 호출부에 맡긴다 (없으면 아무것도 안 붙는다)
  renderBadge?: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
}

export function NearbyListSheet<T extends { id: string; coordinates: Coordinates }>({
  items, loading, error, origin, height, emoji, title, countColorClass, emptyText,
  renderLabel, renderBadge, onSelect,
}: NearbyListSheetProps<T>) {
  const rows = sortByDistance(items, origin, (item) => item.coordinates);

  return (
    <StandardBottomSheet height={height}>
      <div className="flex items-baseline justify-between gap-2 px-4 pt-3 pb-2 border-b border-[#f1f5f9]">
        <p className="text-[13px] font-extrabold text-text-main">
          <span className="mr-1 text-[15px]">{emoji}</span>
          {title} <span className={countColorClass}>{items.length}</span>곳
        </p>
        {origin && <span className="flex-shrink-0 text-[11px] font-bold text-text-hint">가까운 순</span>}
      </div>

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
