import { useEffect, useState } from 'react';

interface NoticeBannerProps {
  shouldShow: boolean;
  message: string;
  delayMs?: number;
  // true면 한 번 표시된 뒤 shouldShow가 false가 되어도 다시 숨기지 않음 (기본값 false: 조건이 꺼지면 즉시 숨김)
  persistOnceShown?: boolean;
}

// 슬라이드-페이드 등장 공지 배너 (셔틀 시간표 변경 예고, 헬스장 방학 단축 운영 안내 등에서 공용으로 사용)
export function NoticeBanner({ shouldShow, message, delayMs = 1000, persistOnceShown = false }: NoticeBannerProps) {
  const [visible, setVisible] = useState(false);

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
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-primary/[0.04] border border-primary/10 rounded-card">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-[12px] font-bold text-text-main leading-tight">
          {message}
        </span>
      </div>
    </div>
  );
}
