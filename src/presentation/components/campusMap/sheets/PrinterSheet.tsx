// 지도 하단 바텀시트: 프린터 — 프린터 리스트(+거리) / 개별 상세
// '빠진 프린터 제보' 입구는 시트 안이 아니라 시트 위 플로팅 배너(CampusMapView)에 있다
import { useMemo, type ReactNode } from 'react';
import { X, Megaphone, Clock, ChevronRight } from 'lucide-react';
import { printerDisplayName, type Printer, type PlottablePrinter } from '../../../../domain/entities/Printer.js';
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
  onReportEdit: () => void;                     // 상세 하단 '수정 제보' → 지금 보고 있는 프린터의 정보 수정 제보
}

// 흡연장·주차장 시트와 동일한 규격
function NearestBadge() {
  return (
    <span className="flex-shrink-0 text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">
      가장 가까운 곳
    </span>
  );
}

// 목록 행에서 고장 난 프린터만 표시 — 검색 결과의 '폐업' 태그(SearchOverlay)와 같은 모양
function BrokenTag() {
  return (
    <span className="flex-shrink-0 text-[9px] font-bold px-1 py-px rounded bg-red-50 text-red-400 border border-red-100">
      고장
    </span>
  );
}

// 상세 헤더에서 이름 바로 옆에 붙는 고장 뱃지 — 고장으로 '등록된' 프린터에만 붙인다.
// broken:false는 '고장 등록 없음'일 뿐 '정상 작동 확인'이 아니라서(API 문서), 예전의 초록 '작동 중' 뱃지는 없앴다
function BrokenBadge() {
  return (
    <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 bg-red-50 border-red-100 text-red-600">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-red-500" />
      <span className="text-[10px] font-bold leading-none">고장</span>
    </span>
  );
}

// 정보 카드의 한 줄 (라벨 · 값) — 아이콘 없이 글자만. 라벨 칸 폭이 고정이라 값들이 세로로 나란히 맞는다.
// 값이 없으면 줄을 숨기지 않고 '정보 없음'으로 둬서 프린터마다 카드 모양이 달라지지 않게 하고,
// 사용자가 '없는 정보'와 '빠뜨린 정보'를 헷갈리지 않게 한다
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    // first/last: 첫 줄 위·마지막 줄 아래 패딩만 줄여, 헤더·참고사항과의 간격이 줄 패딩만큼 두 번 벌어지지 않게
    <div className="flex items-start gap-2.5 px-0.5 py-1.5 first:pt-1 last:pb-1">
      <span className="flex-shrink-0 w-[52px] text-[11px] font-bold text-text-hint leading-[1.6]">{label}</span>
      <div className="flex-1 min-w-0 text-[12px] font-semibold text-text-main leading-[1.6] break-keep">{children}</div>
    </div>
  );
}

function Empty() {
  return <span className="text-text-hint font-medium">정보 없음</span>;
}

// '2026-11-03' → { date: '2026.11.03', relative: '3일 전' }. 한 달이 넘으면 상대 표기는 생략한다
function formatUpdatedAt(iso: string): { date: string; relative: string | null } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const date = `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
  const today = new Date();
  const diffDays = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000
  );
  const relative = diffDays <= 0 ? '오늘' : diffDays === 1 ? '어제' : diffDays < 31 ? `${diffDays}일 전` : null;
  return { date, relative };
}

function PrinterDetailBody({ printer }: { printer: Printer }) {
  const updated = printer.updatedAt ? formatUpdatedAt(printer.updatedAt) : null;
  return (
    <>
      {/* 배경·구분선 없이 촘촘한 라벨-값 목록으로 — 시트 위에서 가볍게 한눈에 읽힌다 */}
      <div>
        <InfoRow label="세부위치">{printer.detailLocation ?? <Empty />}</InfoRow>
        <InfoRow label="가격">{printer.price ?? <Empty />}</InfoRow>
        <InfoRow label="결제방식">{printer.paymentMethod ?? <Empty />}</InfoRow>
        {/* 참고사항도 다른 정보와 같은 줄 형식 — 공지가 없는 프린터가 대부분이라 '정보 없음' 대신 줄 자체를 숨긴다 */}
        {printer.notes && (
          <InfoRow label="참고사항">{printer.notes}</InfoRow>
        )}
      </div>

      {/* 최근 수정일 — 정보가 얼마나 믿을 만한지 사용자가 스스로 판단할 수 있게 */}
      <div className="flex items-center gap-1 px-1">
        <Clock size={10} className="flex-shrink-0 text-text-hint" />
        <span className="text-[10px] font-medium text-text-hint">
          {updated
            ? `최근 수정 ${updated.date}${updated.relative ? ` (${updated.relative})` : ''}`
            : '수정일 정보 없음'}
        </span>
      </div>
    </>
  );
}

// 프린터 제보 입구의 안쪽 내용 — 목록 위 플로팅 배너('프린터 정보를 제보해주세요!')가 쓴다
// (상세 하단 '틀린 정보가 있나요?' 버튼은 모양이 달라 PrinterSheet 안에서 따로 그린다).
// 아이콘·글씨는 학식탭 제보 배너(NoticeBanner plain)와 같은 규격. 끝에는 '제보하기' 버튼 대신
// 목록 행과 같은 › 화살표를 둬서, 배너 전체가 눌러서 들어가는 버튼임을 보여준다.
// 바깥(여백·테두리·그림자)은 놓이는 자리에 맞춰 쓰는 쪽이 감싼다.
export function PrinterReportContent({ label = '프린터 정보를 제보해주세요!' }: { label?: string }) {
  return (
    <>
      <div className="flex items-center gap-2.5 min-w-0">
        <Megaphone size={15} strokeWidth={2.4} className="flex-shrink-0 text-primary" />
        <span className="text-[13px] font-semibold text-text-main leading-snug truncate">{label}</span>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 text-text-hint" />
    </>
  );
}

export function PrinterSheet({ printers, origin, expanded, onToggleExpand, selected, onSelect, onClose, onReportEdit }: Props) {
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
          {/* 이름이 길면 이름만 말줄임되고 상태 뱃지는 항상 이름 바로 뒤에 붙어 보인다 */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="min-w-0 text-[16px] font-extrabold text-text-main truncate">{printerDisplayName(selected)}</span>
            {selected.broken && <BrokenBadge />}
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

        {/* key: 다른 프린터로 바뀌면 스크롤 컨테이너를 리마운트해 scrollTop이 남지 않게 (StoreSheet와 같은 방식) */}
        <div key={`detail-${selected.id}`} className={`flex-1 overflow-y-auto px-4 pt-2 space-y-2.5 ${NAV_CLEARANCE_CLASS}`}>
          <PrinterDetailBody printer={selected} />

          {/* 이 프린터 정보 수정 제보 — 플로팅 배너와 같은 안쪽 내용이지만, 시트 안이라 테두리·그림자 없이 둔다.
              문구는 '수정 제보' 버튼 바로 옆에 붙도록 오른쪽 정렬(justify-end) — 질문과 버튼을 한 덩어리로 읽히게.
              위쪽 옅은 선(헤더 구분선과 같은 색)으로 '정보'와 '제보 입구'를 나눈다 */}
          <button
            onClick={onReportEdit}
            className="!mt-3 w-full h-12 px-0.5 border-t border-[#f1f5f9] flex items-center justify-end gap-1.5 [-webkit-tap-highlight-color:transparent] active:scale-[0.98] transition-transform"
          >
            {/* 질문·버튼 모두 아이콘 없이 글자만 — 시트 안이라 정보 줄들 사이에서 튀지 않게
                (플로팅 배너는 PrinterReportContent 그대로 — 이 버튼만 따로 그린다) */}
            <span className="min-w-0 text-[12px] font-semibold text-text-main leading-snug truncate">틀린 정보가 있나요?</span>
            <span className="flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/[0.06] text-primary">
              제보하기
            </span>
          </button>
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
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[14px] font-extrabold text-text-main truncate">{printerDisplayName(p)}</span>
          {p.broken && <BrokenTag />}
        </div>
      )}
      renderBadge={(p) => (p.id === nearestId ? <NearestBadge /> : null)}
    />
  );
}
