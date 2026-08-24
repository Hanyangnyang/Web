import { useEffect, useState } from 'react';

interface NoticeBannerProps {
  shouldShow: boolean;
  message: string;
  delayMs?: number;
  // true면 한 번 표시된 뒤 shouldShow가 false가 되어도 다시 숨기지 않음 (기본값 false: 조건이 꺼지면 즉시 숨김)
  persistOnceShown?: boolean;
  // 있으면 배너 오른쪽에 액션 버튼이 같이 뜬다 (예: 지하철 연결편 조회 실패 시 "다시 시도")
  actionLabel?: string;
  onAction?: () => void;
  // info: 일반 공지(파랑, 기본값) — 셔틀 시간표 변경 예고, 헬스장 방학 단축 운영 안내
  // error: 실패 안내(빨강/핑크) — 지하철 조회 실패 등
  variant?: 'info' | 'error';
}

const VARIANT_STYLE = {
  info: { container: 'bg-primary/[0.04] border-primary/10', icon: 'text-primary', button: 'bg-primary/90 shadow-[0_4px_12px_rgba(14,74,132,0.2)]' },
  error: { container: 'bg-error/[0.06] border-error/60', icon: 'text-error', button: 'bg-error/90 shadow-[0_4px_12px_rgba(239,68,68,0.2)]' },
};

// 슬라이드-페이드 등장 공지 배너 (셔틀 시간표 변경 예고, 헬스장 방학 단축 운영 안내, 지하철 조회 실패 안내 등에서 공용으로 사용)
export function NoticeBanner({ shouldShow, message, delayMs = 1000, persistOnceShown = false, actionLabel, onAction, variant = 'info' }: NoticeBannerProps) {
  const [visible, setVisible] = useState(false);
  const style = VARIANT_STYLE[variant];

  useEffect(() => {
    if (!shouldShow) {
      if (!persistOnceShown) setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [shouldShow, delayMs, persistOnceShown]);

  return (
    <div
      className={`overflow-hidden transition-all duration-500 ease-in-out ${visible ? 'max-h-16 mb-4 opacity-100' : 'max-h-0 opacity-0 mb-0 pointer-events-none'}`}
    >
      <div className={`flex items-center justify-between gap-2.5 px-4 py-2.5 border rounded-card ${style.container}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 ${style.icon}`}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-[12px] font-bold text-text-main leading-tight">
            {message}
          </span>
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className={`flex-shrink-0 text-white text-[11px] px-2 py-1 rounded-full active:scale-95 transition-transform ${style.button}`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
