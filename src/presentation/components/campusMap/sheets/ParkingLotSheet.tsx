// 지도 하단 바텀시트: 주차장 — 지금 화면에 보이는 주차장 리스트(+거리) / 개별 상세
import { useMemo } from 'react';
import { X } from 'lucide-react';
import type { PlottableParkingLot } from '../../../../domain/entities/ParkingLot.js';
import { nearestTo, type LatLng } from '../../../../lib/campusGeo.js';
import { StandardBottomSheet } from '../../ui/StandardBottomSheet.js';
import { PARKING_DETAIL_FRACTION, PARKING_LIST_FRACTION, NAV_CLEARANCE_CLASS, toCssHeight } from './sheetMetrics';
import { NearbyListSheet } from './NearbyListSheet';

interface Props {
  lots: PlottableParkingLot[];   // 좌표가 확정된 주차장만 (visibleParkingLots로 걸러 넘긴다)
  origin: LatLng | null;  // 거리 계산 기준점 (내 위치 또는 화면 중심)
  expanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  selected: PlottableParkingLot | null;
  onSelect: (lot: PlottableParkingLot) => void;
  onClose: () => void;                          // 상세 닫기 → 목록으로 복귀
}

// 흡연장 시트와 동일한 규격 — 칩을 켜면 가장 가까운 곳이 자동으로 골라진다
function NearestBadge() {
  return (
    <span className="flex-shrink-0 text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
      가장 가까운 곳
    </span>
  );
}

export function ParkingLotSheet({ lots, origin, expanded, onToggleExpand, selected, onSelect, onClose }: Props) {
  const nearestId = useMemo(
    () => nearestTo(lots, origin, (l) => l.coordinates)?.id ?? null,
    [lots, origin]
  );

  // ── 상세 모드 ──
  if (selected) {
    return (
      <StandardBottomSheet height={toCssHeight(PARKING_DETAIL_FRACTION)}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0">🅿️</span>
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
          {selected.capacity != null && (
            <p className="text-[12px] text-text-main font-medium leading-[1.6]">🚗 총 {selected.capacity}대</p>
          )}
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
      items={lots}
      loading={false}
      error={null}
      origin={origin}
      height={toCssHeight(PARKING_LIST_FRACTION)}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      emoji="🅿️"
      title="주차장"
      countColorClass="text-[#475569]"
      emptyText="표시할 주차장이 없어요"
      onSelect={onSelect}
      renderLabel={(l) => (
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[14px] font-extrabold text-text-main truncate">{l.name}</span>
          {l.capacity != null && (
            <span className="flex-shrink-0 text-[11px] font-bold text-text-hint">{l.capacity}대</span>
          )}
        </div>
      )}
      renderBadge={(l) => (l.id === nearestId ? <NearestBadge /> : null)}
    />
  );
}
