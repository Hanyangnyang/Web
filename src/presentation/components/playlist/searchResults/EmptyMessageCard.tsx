interface EmptyMessageCardProps {
  message: string;
  className?: string;
  minHeight?: number;
  action?: { label: string; onClick: () => void }; // 안내 아래 알약 버튼 — 유도할 액션이 있을 때만
}

// 카드형 콘텐츠 목록이 비었을 때 쓰는 실선 테두리 안내 박스 — 뚜렷하게 유도할 액션이 없는 상황
// (검색 결과 없음, 글자 수 안내 등)에서 EmptyGenreState(버튼 포함)보다 가볍게 씀.
// 테두리가 있어 "빈 슬롯"처럼 자연스럽게 읽혀서, 로딩 스켈레톤·채워진 카드와 같은 자리에서
// 전환돼도 레이아웃이 크게 튀어 보이지 않음
export function EmptyMessageCard({ message, className = '', minHeight, action }: EmptyMessageCardProps) {
  return (
    <div
      className={`w-full px-4 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center gap-1 ${minHeight ? '' : 'py-8'} ${className}`}
      style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
    >
      <p className="text-[13px] text-text-hint whitespace-pre-line">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="relative before:content-[''] before:absolute before:-inset-2 flex items-center gap-1 px-3.5 py-2 rounded-full bg-white text-text-sub border border-slate-200 shadow-sm text-[12px] font-semibold cursor-pointer active:scale-[0.97] transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
