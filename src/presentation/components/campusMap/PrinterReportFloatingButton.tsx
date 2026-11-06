// 프린터 칩의 플로팅 제보 버튼 — 내 위치 버튼 바로 왼쪽에 붙는다.
//  - 시트가 접힌 기본 상태: 내용(📢 + 문구 + ›)에 딱 맞는 폭의 배너, 오른쪽 정렬
//  - 시트가 올라가면(compact): 오른쪽 끝을 고정한 채 폭만 줄어 44px 동그라미(📢)가 된다
//  - 동그라미를 누르면: 바로 팝업을 열지 않고 먼저 배너로 펼친다(무슨 버튼인지 보여주기). 펼친 상태에서 누르면 팝업.
//    펼침은 시트 상태가 바뀌면(collapseKey 변경 — 다른 프린터 선택·목록 접고 펴기·상세 닫기) 다시 접힌다
//
// CSS는 width:auto → 44px 사이를 애니메이션하지 못해서, 내용 폭을 실제로 재(px) 그 값과 44px 사이를 transition한다.
// 글꼴이 늦게 로드되거나 문구가 바뀌어 폭이 달라져도 ResizeObserver가 다시 잰다
import { useLayoutEffect, useRef, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { PrinterReportContent } from './sheets/PrinterSheet';

const COMPACT_SIZE = 44;  // 내 위치 버튼과 같은 지름
const BORDER_X = 2;       // 좌우 테두리 1px씩 — 내용 폭에 더해야 내용이 잘리지 않는다

interface Props {
  compact: boolean;       // 시트가 올라가 있어 동그라미로 접혀야 하는 상태
  // 이 값이 바뀌면 동그라미를 눌러 펼쳐 둔 상태를 되돌린다 (시트 상태가 바뀌었다는 신호)
  collapseKey: string;
  bottom: string;         // 내 위치 버튼과 같은 줄에 서도록 쓰는 쪽이 계산해 넘긴다
  onClick: () => void;    // 제보 팝업 열기 — 펼쳐진 상태에서 눌렀을 때만 불린다
  onExpand?: () => void;  // 동그라미를 눌러 펼쳤을 때 (계측용)
}

export function PrinterReportFloatingButton({ compact, collapseKey, bottom, onClick, onExpand }: Props) {
  const contentRef = useRef<HTMLSpanElement>(null);
  const [contentWidth, setContentWidth] = useState<number | null>(null);

  // 동그라미를 눌러 펼친 시점의 collapseKey. 지금 키와 같을 때만 펼침이 유효하다 —
  // 키가 바뀌면(시트 상태 변경) 따로 되돌리는 코드 없이 자연히 다시 접힌다 (effect로 리셋하지 않아도 됨)
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const showCompact = compact && expandedFor !== collapseKey;

  const handleClick = () => {
    if (showCompact) {
      setExpandedFor(collapseKey);
      onExpand?.();
      return;
    }
    onClick();
  };

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // 내용은 absolute + nowrap이라 버튼 폭과 상관없이 자기 길이만큼의 폭을 갖는다 → 그대로 재면 된다
    const ro = new ResizeObserver(() => setContentWidth(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const expandedWidth = contentWidth !== null ? `${contentWidth + BORDER_X}px` : 'auto';

  return (
    <button
      onClick={handleClick}
      // 동그라미일 땐 누르면 펼쳐지기만 하므로 화면 낭독기에도 그렇게 알린다
      aria-label={showCompact ? '프린터 제보 버튼 펼치기' : '프린터 정보 제보하기'}
      aria-expanded={!showCompact}
      style={{
        bottom,
        width: showCompact ? `${COMPACT_SIZE}px` : expandedWidth,
        // 문구가 길어도 화면 왼쪽 여백(12px)을 넘지 않게 — 넘치면 문구가 말줄임된다
        maxWidth: 'calc(100% - 76px)',
      }}
      className="absolute right-16 z-30 h-11 overflow-hidden rounded-full bg-white border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.18)] [-webkit-tap-highlight-color:transparent] active:scale-[0.98] transition-[width,transform] duration-300 ease-out"
    >
      {/* 펼친 내용 — 오른쪽에 붙여 두어, 버튼이 줄어들 때 왼쪽부터 가려지며 오른쪽으로 접혀 보인다 */}
      <span
        ref={contentRef}
        aria-hidden={showCompact}
        className={`absolute right-0 inset-y-0 px-4 flex items-center gap-2.5 whitespace-nowrap transition-opacity duration-200 ${
          showCompact ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <PrinterReportContent />
      </span>
      {/* 접힌 동그라미 — 펼친 배너의 📢 아이콘과 같은 남색(primary)이라 접혀도 같은 버튼으로 이어 보인다 */}
      <span
        aria-hidden={!showCompact}
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          showCompact ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Megaphone size={18} strokeWidth={2.4} className="text-primary" />
      </span>
    </button>
  );
}
