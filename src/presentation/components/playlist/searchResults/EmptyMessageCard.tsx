interface EmptyMessageCardProps {
  message: string;
  className?: string;
  minHeight?: number;
}

// 카드형 콘텐츠 목록이 비었을 때 쓰는 점선 테두리 안내 박스 — 뚜렷하게 유도할 액션이 없는 상황
// (검색 결과 없음, 글자 수 안내 등)에서 EmptyGenreState(버튼 포함)보다 가볍게 씀.
// 점선 테두리라 "빈 슬롯"처럼 자연스럽게 읽혀서, 로딩 스켈레톤·채워진 카드와 같은 자리에서
// 전환돼도 레이아웃이 크게 튀어 보이지 않음
export function EmptyMessageCard({ message, className = '', minHeight }: EmptyMessageCardProps) {
  return (
    <div
      className={`w-full px-4 rounded-xl border border-dashed border-slate-200 text-center flex items-center justify-center ${minHeight ? '' : 'py-8'} ${className}`}
      style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
    >
      <p className="text-sm text-text-hint">{message}</p>
    </div>
  );
}
