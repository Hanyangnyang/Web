// 목록 시트 상단의 접힘/펼침 손잡이 — 매장·교내시설·오픈스페이스·흡연장 시트가 함께 쓴다.
import { useRef, type ReactNode } from 'react';

const SWIPE_THRESHOLD_PX = 30;

interface Props {
  expanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function SheetHandle({ expanded, onToggleExpand, children, className = '' }: Props) {
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > SWIPE_THRESHOLD_PX) onToggleExpand(true);
    else if (delta < -SWIPE_THRESHOLD_PX) onToggleExpand(false);
    touchStartY.current = null; // 다음 터치가 이전 시작점을 물려받지 않도록
  };

  return (
    <div
      className={`flex flex-col flex-shrink-0 px-4 pt-2.5 pb-2 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        className="self-center p-1 [-webkit-tap-highlight-color:transparent]"
        onClick={() => onToggleExpand(!expanded)}
        aria-label={expanded ? '리스트 접기' : '리스트 펼치기'}
      >
        <span className="block w-9 h-1 rounded-full bg-slate-200" />
      </button>
      <div className="mt-1">{children}</div>
    </div>
  );
}
