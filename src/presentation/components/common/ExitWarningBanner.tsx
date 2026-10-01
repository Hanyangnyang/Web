import { useEffect, useState } from 'react';
import { onExitWarning } from '../../../lib/androidBackHandler.js';

const BANNER_DURATION_MS = 2000;

// 표시 여부와 타이머를 모르는 순수 UI. 스토리북에서 이 부분만 따로 띄워 보려고 분리했다.
export function ExitWarningBannerView() {
  return (
    <div
      className="fixed inset-x-0 bottom-[calc(24px+64px+12px+env(safe-area-inset-bottom))] z-[1001] flex justify-center pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div style={{ animation: 'fadeIn 0.2s ease-out' }} className="flex items-center px-4 py-2.5 rounded-full bg-gray-500 text-white text-[13px] font-bold shadow-lg">
        한 번 더 누르면 종료됩니다
      </div>
    </div>
  );
}

// 안드로이드에서 뒤로가기를 한 번 눌렀을 때 "한 번 더 누르면 종료" 안내를 하단에 잠깐 띄운다.
export function ExitWarningBanner() {
  // 재표시 때 타이머를 다시 시작하도록 매번 새 값(타임스탬프)을 넣는다.
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => onExitWarning(() => setShownAt(Date.now())), []);

  useEffect(() => {
    if (shownAt === null) return;
    const timer = setTimeout(() => setShownAt(null), BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [shownAt]);

  if (shownAt === null) return null;

  return <ExitWarningBannerView />;
}
