import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { onExitWarning } from '../../../lib/androidBackHandler.js';

const BANNER_DURATION_MS = 2000;

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

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(24px+64px+12px+env(safe-area-inset-bottom))] z-[1001] flex justify-center pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div style={{ animation: 'fadeIn 0.2s ease-out' }} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-600 text-white text-[13px] font-bold shadow-lg">
        <TriangleAlert className="w-4 h-4 shrink-0" strokeWidth={2.25} />
        한 번 더 누르면 종료됩니다
      </div>
    </div>
  );
}
