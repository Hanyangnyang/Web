// 프린터 칩의 플로팅 제보 버튼 — 내 위치 버튼 바로 왼쪽(오른쪽 정렬)에 붙는, 내용(📢 + 문구 + ›) 폭의 배너.
// 시트가 올라가도 접지 않고 늘 펼친 채로 둔다 (위치만 시트 높이를 따라 올라간다)
import { PrinterReportContent } from './sheets/PrinterSheet';

interface Props {
  bottom: string;         // 내 위치 버튼과 같은 줄에 서도록 쓰는 쪽이 계산해 넘긴다
  onClick: () => void;
}

export function PrinterReportFloatingButton({ bottom, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="프린터 정보 제보하기"
      // max-w: 문구가 길어도 화면 왼쪽 여백(12px)을 넘지 않게 — 넘치면 문구가 말줄임된다
      style={{ bottom, maxWidth: 'calc(100% - 76px)' }}
      className="absolute right-16 z-30 h-11 px-4 inline-flex items-center gap-2.5 rounded-full bg-white border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.18)] [-webkit-tap-highlight-color:transparent] active:scale-[0.98] transition-transform"
    >
      <PrinterReportContent />
    </button>
  );
}
