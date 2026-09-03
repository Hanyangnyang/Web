interface EmptyMessageCardProps {
  message: string;
  className?: string;
  // 카드 그리드/캐러셀 안에서 쓸 때, 로딩 스켈레톤·채워진 카드와 같은 높이(px)로 맞추기 위한 값 —
  // 안 주면 기본 padding(py-8) 기반 높이로 표시(세로 목록 등 높이를 맞출 대상이 없는 곳에서 씀)
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
      {/* EmptyGenreState(버튼 포함 빈 상태)의 안내 문구와 같은 text-sm — 버튼 유무로 같은 "결과 없음"
          메시지가 화면마다 다른 크기로 보이지 않게 맞춤 */}
      <p className="text-sm text-text-hint">{message}</p>
    </div>
  );
}
