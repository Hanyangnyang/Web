// 지도 하단 바텀시트: 흡연장 — 지금 화면에 보이는 흡연 부스/구역 리스트(+거리) / 개별 상세
import { X } from 'lucide-react';
import type { SmokingSpot } from '../../../domain/entities/SmokingSpot.js';
import type { LatLng } from '../../../lib/geo.js';
import { BottomSheetFrame } from '../ui/BottomSheetFrame.js';
import { SMOKING_DETAIL_FRACTION, SMOKING_LIST_FRACTION, NAV_CLEARANCE_CLASS, toCssHeight } from './sheetHeights';
import { NearbyListSheet } from './NearbyListSheet';

interface Props {
  spots: SmokingSpot[];
  loading: boolean;
  error: string | null;
  origin: LatLng | null;  // 거리 계산 기준점 (내 위치 또는 화면 중심)
  selected: SmokingSpot | null;
  onSelect: (spot: SmokingSpot) => void;
  onClose: () => void;                          // 상세 닫기 → 목록으로 복귀
}


export function SmokingSpotSheet({ spots, loading, error, origin, selected, onSelect, onClose }: Props) {
  // ── 상세 모드 ──
  if (selected) {
    return (
      <BottomSheetFrame height={toCssHeight(SMOKING_DETAIL_FRACTION)}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0">🚬</span>
          <div className="flex-1 min-w-0">
            <span className="block text-[16px] font-extrabold text-text-main truncate">{selected.name}</span>
          </div>
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
      </BottomSheetFrame>
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
      emoji="🚬"
      title="흡연장"
      countColorClass="text-[#475569]"
      emptyText="표시할 흡연장이 없어요"
      onSelect={onSelect}
      renderLabel={(s) => (
        // 이름에 이미 '흡연부스'·'흡연구역'이 들어있어 유형 라벨은 같은 말을 두 번 하는 셈이라 뺐다
        <span className="block text-[14px] font-extrabold text-text-main truncate">{s.name}</span>
      )}
    />
  );
}
