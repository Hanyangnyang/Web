// ErrorBoundary가 카드 형태의 섹션을 대체할 때 쓰는 폴백
interface CardFallbackProps {
  message: string;
}

export function CardFallback({ message }: CardFallbackProps) {
  return (
    <div className="bg-white rounded-card border border-slate-200 py-8 flex items-center justify-center shadow-sm opacity-80">
      <p className="text-center text-text-sub text-sm font-semibold">{message}</p>
    </div>
  );
}
