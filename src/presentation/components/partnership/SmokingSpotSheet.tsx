// 지도 하단 바텀시트: 흡연장 — 지금 화면에 보이는 흡연 부스/구역 리스트(+거리) / 개별 상세
import { X, ChevronRight } from 'lucide-react';
import { SMOKING_SPOT_TYPE_LABEL, type SmokingSpot } from '../../../domain/entities/SmokingSpot.js';
import { distanceMeters, formatDistance } from '../../../lib/geo.js';
import { SheetFrame } from './StoreSheet';

interface Props {
  spots: SmokingSpot[];                        // 현재 화면(뷰포트) 안에 보이는 흡연장들
  origin: { lat: number; lng: number } | null;  // 거리 계산 기준점 (내 위치 또는 화면 중심)
  selected: SmokingSpot | null;
  onSelect: (spot: SmokingSpot) => void;
  onClose: () => void;                          // 상세 닫기 → 목록으로 복귀
}

const NAV_CLEARANCE = 'pb-[calc(108px+env(safe-area-inset-bottom,0px))]';

// 상세 모드 시트 비율 — 아래 SheetFrame의 h-[32%]와 반드시 같은 값으로 맞춘다 (지도 포커스 센터링에도 쓰임)
export const SMOKING_DETAIL_HEIGHT_FRACTION = 0.32;

export function SmokingSpotSheet({ spots, origin, selected, onSelect, onClose }: Props) {
  // ── 상세 모드 ──
  if (selected) {
    return (
      <SheetFrame heightClass="h-[32%]">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0">🚬</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-extrabold text-text-main truncate">{selected.name}</span>
              <span className="text-[11px] font-bold text-text-hint flex-shrink-0">{SMOKING_SPOT_TYPE_LABEL[selected.type]}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 [-webkit-tap-highlight-color:transparent] active:scale-90 transition-transform"
            aria-label="목록으로"
          >
            <X size={18} className="text-text-hint" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-2.5 ${NAV_CLEARANCE}`}>
          {selected.description && (
            <p className="text-[12px] text-text-main font-medium leading-[1.6]">{selected.description}</p>
          )}
        </div>
      </SheetFrame>
    );
  }

  // ── 목록 모드: 화면에 보이는 흡연장 + 거리순 정렬 ──
  const rows = spots
    .map((spot) => ({
      spot,
      dist: origin
        ? distanceMeters(origin.lat, origin.lng, spot.coordinates.latitude, spot.coordinates.longitude)
        : null,
    }))
    .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));

  return (
    <SheetFrame heightClass="h-[45%]">
      <div className="px-4 pt-3 pb-2 border-b border-[#f1f5f9]">
        <p className="text-[13px] font-extrabold text-text-main">
          이 화면의 흡연장 <span className="text-[#475569]">{spots.length}</span>곳
        </p>
      </div>
      <div className={`flex-1 overflow-y-auto ${NAV_CLEARANCE}`}>
        {rows.length === 0 && (
          <p className="text-center text-[12px] text-text-hint font-medium pt-6">화면 안에 흡연장이 없어요 — 지도를 움직여보세요</p>
        )}
        {rows.map(({ spot, dist }, idx) => (
          <button
            key={spot.id}
            onClick={() => onSelect(spot)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 [-webkit-tap-highlight-color:transparent] ${
              idx > 0 ? 'border-t border-[#f1f5f9]' : ''
            }`}
          >
            <span className="text-xl flex-shrink-0">🚬</span>
            <div className="flex-1 min-w-0">
              <span className="text-[14px] font-extrabold text-text-main truncate block">{spot.name}</span>
              <span className="text-[10px] font-bold text-text-hint">{SMOKING_SPOT_TYPE_LABEL[spot.type]}</span>
            </div>
            {dist != null && (
              <span className="flex-shrink-0 text-[11px] font-bold text-text-hint">{formatDistance(dist)}</span>
            )}
            <ChevronRight size={16} className="flex-shrink-0 text-text-hint" />
          </button>
        ))}
      </div>
    </SheetFrame>
  );
}
