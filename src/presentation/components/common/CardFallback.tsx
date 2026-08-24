// ErrorBoundary가 카드 형태의 섹션을 대체할 때 쓰는 폴백. 조회(쿼리) 실패 상태를
// 보여주는 화면들(카페테리아/셔틀/헬스장)에서도 동일한 카드 모양이라 재사용한다 —
// onRetry를 넘기면 그 API를 재요청하는 "다시 시도" 버튼이 같이 뜬다.
interface CardFallbackProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function CardFallback({ message, onRetry, className = '' }: CardFallbackProps) {
  return (
    <div className={`bg-white rounded-card border border-slate-200 py-8 flex flex-col items-center justify-center gap-3 shadow-sm opacity-80 ${className}`}>
      <p className="text-center text-text-sub text-sm font-semibold">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold text-primary bg-[rgba(14,74,132,0.08)] px-3.5 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
