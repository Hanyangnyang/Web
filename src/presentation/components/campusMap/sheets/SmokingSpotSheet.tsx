// 지도 하단 바텀시트: 흡연장 — 지금 화면에 보이는 흡연 부스/구역 리스트(+거리) / 개별 상세
import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { PlottableSmokingSpot } from '../../../../domain/entities/SmokingSpot.js';
import { nearestTo, type LatLng } from '../../../../lib/campusGeo.js';
import { StandardBottomSheet } from '../../ui/StandardBottomSheet.js';
import { SMOKING_DETAIL_FRACTION, SMOKING_LIST_FRACTION, NAV_CLEARANCE_CLASS, toCssHeight } from './sheetMetrics';
import { NearbyListSheet } from './NearbyListSheet';

interface Props {
  spots: PlottableSmokingSpot[];   // 좌표가 확정된 흡연장만 (visibleSmokingSpots로 걸러 넘긴다)
  loading: boolean;
  error: string | null;
  origin: LatLng | null;  // 거리 계산 기준점 (내 위치 또는 화면 중심)
  expanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  selected: PlottableSmokingSpot | null;
  onSelect: (spot: PlottableSmokingSpot) => void;
  onClose: () => void;                          // 상세 닫기 → 목록으로 복귀
}

// 흡연장 칩을 켜면 이 곳이 자동으로 골라진다. 상세로 바로 들어오면 "왜 여기가 열렸지"가 설명되지 않고,
// 목록에서는 거리 순 1등을 눈으로 대조하지 않아도 되게 한다. (규격은 매장 시트의 단과대 배지와 동일)
function NearestBadge() {
  return (
    <span className="flex-shrink-0 text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
      가장 가까운 곳
    </span>
  );
}

export function SmokingSpotSheet({ spots, loading, error, origin, expanded, onToggleExpand, selected, onSelect, onClose }: Props) {
  // 기준점이 없으면 null이 되어 어디에도 배지가 붙지 않는다 — 거리를 모르는데 '가장 가까운 곳'이라 할 수 없다
  const nearestId = useMemo(
    () => nearestTo(spots, origin, (s) => s.coordinates)?.id ?? null,
    [spots, origin]
  );

  // ── 상세 모드 ──
  if (selected) {
    return (
      <StandardBottomSheet height={toCssHeight(SMOKING_DETAIL_FRACTION)}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0">🚬</span>
          <div className="flex-1 min-w-0">
            <span className="block text-[16px] font-extrabold text-text-main truncate">{selected.name}</span>
          </div>
          {selected.id === nearestId && <NearestBadge />}
          <button
            onClick={onClose}
            className="p-1 [-webkit-tap-highlight-color:transparent] active:scale-90 transition-transform"
            aria-label="목록으로"
          >
            <X size={18} className="text-text-hint" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-2.5 ${NAV_CLEARANCE_CLASS}`}>
          {selected.description && (
            <p className="text-[12px] text-text-main font-medium leading-[1.6]">{selected.description}</p>
          )}
        </div>
      </StandardBottomSheet>
    );
  }

  // ── 목록 모드: 전체를 가까운 순으로 나열 (껍데기는 NearbyListSheet가, 행 내용만 여기서) ──
  return (
    <NearbyListSheet
      items={spots}
      loading={loading}
      error={error}
      origin={origin}
      height={toCssHeight(SMOKING_LIST_FRACTION)}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      emoji="🚬"
      title="흡연장"
      countColorClass="text-[#475569]"
      emptyText="표시할 흡연장이 없어요"
      onSelect={onSelect}
      renderLabel={(s) => (
        <span className="block text-[14px] font-extrabold text-text-main truncate">{s.name}</span>
      )}
      renderBadge={(s) => (s.id === nearestId ? <NearestBadge /> : null)}
    />
  );
}
