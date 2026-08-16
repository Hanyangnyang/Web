import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AddSongFabProps {
  onClick?: () => void;
}

// 이 FAB은 앱 전역 스크롤 컨테이너(App.tsx)를 prop으로 전달받을 방법이 없어서,
// DOM에서 가장 가까운 스크롤 가능한 조상을 직접 찾아 스크롤 여부를 감지한다.
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
    node = node.parentElement;
  }
  return null;
}

export function AddSongFab({ onClick }: AddSongFabProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const scrollParent = findScrollParent(buttonRef.current);
    if (!scrollParent) return;

    const handleScroll = () => setCollapsed(scrollParent.scrollTop > 8);
    handleScroll();
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollParent.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      aria-label="곡 추천하기"
      className={`fixed right-[max(2.75rem,calc(50%-168px))] h-12 rounded-full bg-blue-200 text-blue-900 ring-1 ring-blue-300 flex items-center justify-center overflow-hidden shadow-[0_6px_20px_rgba(191,219,254,0.5)] hover:shadow-[0_8px_24px_rgba(191,219,254,0.65)] transition-[width,bottom,box-shadow] duration-300 ease-out active:scale-90 z-40 ${
        collapsed ? 'w-12' : 'w-[128px]'
      }`}
      style={{ bottom: 'calc(24px + 64px + 24px + env(safe-area-inset-bottom))' }}
    >
      <Plus size={22} strokeWidth={2.5} className="flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-bold transition-[max-width,opacity,margin-left] duration-200 ease-out ${
          collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[90px] opacity-100 ml-1.5'
        }`}
      >
        곡추천하기
      </span>
    </button>
  );
}
