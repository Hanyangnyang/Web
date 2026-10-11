import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';

interface PlaylistFallbackProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  minHeight?: number;
  icon?: ReactNode;
}

// 플레이리스트 화면 안에서 ErrorBoundary가 일부 영역을 대체하거나, 목록 조회가 실패했을 때 쓰는 폴백.
export function PlaylistFallback({ message, onRetry, className = '', minHeight, icon }: PlaylistFallbackProps) {
  return (
    <div
      className={`w-full px-4 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center gap-1.5 text-center ${minHeight ? '' : 'py-8'} ${className}`}
      style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
    >
      {icon ?? <CircleAlert size={22} className="text-text-hint" />}
      <p className="text-[15px] font-semibold text-text-sub">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="relative before:content-[''] before:absolute before:-inset-2 mt-1 px-5 py-2.5 rounded-full bg-white text-text-main border border-slate-200 shadow-sm text-[13px] font-bold active:scale-95 transition-transform"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
