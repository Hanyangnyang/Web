// 지도 하단 바텀시트: 프린터 — 프린터 리스트(+거리) / 개별 상세
// 위치 목록을 아직 모으는 중이라, 목록 3번째 칸에 '빠진 프린터 제보' 행을 항상 끼운다
import { useMemo } from 'react';
import { X, Megaphone } from 'lucide-react';
import type { PlottablePrinter } from '../../../../domain/entities/Printer.js';
import { nearestTo, type LatLng } from '../../../../lib/campusGeo.js';
import { StandardBottomSheet } from '../../ui/StandardBottomSheet.js';
import { PRINTER_DETAIL_FRACTION, PRINTER_LIST_FRACTION, NAV_CLEARANCE_CLASS, toCssHeight } from './sheetMetrics';
import { NearbyListSheet } from './NearbyListSheet';

interface Props {
  printers: PlottablePrinter[];   // 좌표가 확정된 프린터만 (visiblePrinters로 걸러 넘긴다)
  origin: LatLng | null;  // 거리 계산 기준점 (내 위치 또는 화면 중심)
  expanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  selected: PlottablePrinter | null;
  onSelect: (printer: PlottablePrinter) => void;
  onClose: () => void;                          // 상세 닫기 → 목록으로 복귀
  onReport: () => void;                         // 제보 배너의 '제보하기'
}

// 흡연장·주차장 시트와 동일한 규격
function NearestBadge() {
  return (
    <span className="flex-shrink-0 text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
      가장 가까운 곳
    </span>
  );
}

// '빠진 프린터 제보'의 안쪽 내용 — 시트 목록 3번째 칸과 시트 위 플로팅 배너가 같이 쓴다.
// 아이콘·글씨·버튼은 학식탭 제보 배너(NoticeBanner plain)와 같은 규격으로, 둘이 같은 '제보' 기능임을 모양으로 맞춘다.
// 바깥(여백·테두리·눌림 효과)은 놓이는 자리마다 달라서 쓰는 쪽이 감싼다.
export function PrinterReportContent() {
  return (
    <>
      <div className="flex items-center gap-2.5 min-w-0">
        <Megaphone size={15} strokeWidth={2.4} className="flex-shrink-0 text-primary" />
        <span className="text-[13px] font-semibold text-text-main leading-snug truncate">빠진 프린터가 있나요?</span>
      </div>
      <span className="flex-shrink-0 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-primary/[0.06] text-primary">
        제보하기
      </span>
    </>
  );
}

export function PrinterSheet({ printers, origin, expanded, onToggleExpand, selected, onSelect, onClose, onReport }: Props) {
  const nearestId = useMemo(
    () => nearestTo(printers, origin, (p) => p.coordinates)?.id ?? null,
    [printers, origin]
  );

  // ── 상세 모드 ──
  if (selected) {
    return (
      <StandardBottomSheet height={toCssHeight(PRINTER_DETAIL_FRACTION)}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#f1f5f9]">
          <span className="text-2xl flex-shrink-0">🖨️</span>
          <div className="flex-1 min-w-0">
            <span className="block text-[16px] font-extrabold text-text-main truncate">{selected.name}</span>
            {selected.location && (
              <span className="block text-[12px] font-bold text-text-hint truncate mt-0.5">{selected.location}</span>
            )}
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
      items={printers}
      loading={false}
      error={null}
      origin={origin}
      height={toCssHeight(PRINTER_LIST_FRACTION)}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      emoji="🖨️"
      title="프린터"
      countColorClass="text-[#475569]"
      emptyText="표시할 프린터가 없어요"
      onSelect={onSelect}
      renderLabel={(p) => (
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-[14px] font-extrabold text-text-main truncate">{p.name}</span>
          {p.location && (
            <span className="flex-shrink-0 text-[11px] font-bold text-text-hint">{p.location}</span>
          )}
        </div>
      )}
      renderBadge={(p) => (p.id === nearestId ? <NearestBadge /> : null)}
      // 가까운 2곳 바로 다음(3번째 칸) — 접힌/조금 펼친 상태에서도 스크롤 없이 보이게
      bannerAfter={2}
      banner={
        // 여백·구분선은 목록의 다른 행과 같은 규격 — 행 하나의 내용만 바뀐 것처럼 보이게.
        // 배경만 셔틀탭 공지 배너(NoticeBanner info)와 같은 연한 파랑으로 깔아 일반 항목과 구분한다
        <button
          onClick={onReport}
          className="w-full flex items-center justify-between gap-2.5 px-4 py-3 text-left bg-primary/[0.04] active:bg-primary/[0.08] [-webkit-tap-highlight-color:transparent]"
        >
          <PrinterReportContent />
        </button>
      }
    />
  );
}
