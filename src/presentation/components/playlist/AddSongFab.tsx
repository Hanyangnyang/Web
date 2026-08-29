import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AddSongFabProps {
  onClick?: () => void;
  // FloatingSpotifyPlayer가 측정해서 올려준 실제 카드 높이(px). 0이면 플레이어 닫힘.
  playerHeight?: number;
}

// 열림/닫힘 상태 관계없이 화면 끝에서 항상 1rem 여백
const FAB_RIGHT = 'right-[max(1rem,calc((100vw-440px)/2+1rem))]';
const CLOSED_BOTTOM = 'calc(24px + env(safe-area-inset-bottom))';
// 플레이어 카드 위 16px 간격을 두고 뜨도록 — 높이는 실측값을 그대로 사용
const PLAYER_GAP = 16;

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

export function AddSongFab({ onClick, playerHeight = 0 }: AddSongFabProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const bottom =
    playerHeight > 0
      ? `calc(${playerHeight}px + ${PLAYER_GAP}px + env(safe-area-inset-bottom))`
      : CLOSED_BOTTOM;

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
      className={`fixed ${FAB_RIGHT} z-40 h-12 rounded-full bg-[#2B3B52] text-white border border-transparent flex items-center justify-center overflow-hidden shadow-[0_6px_20px_rgba(43,59,82,0.35)] hover:shadow-[0_8px_24px_rgba(43,59,82,0.45)] transition-[width,bottom,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 ${
        collapsed ? 'w-12' : 'w-[128px]'
      }`}
      style={{ bottom }}
    >
      <Plus size={22} strokeWidth={2.5} className="flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-bold transition-[max-width,opacity,margin-left] duration-200 ease-out ${
          collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[90px] opacity-100 ml-1.5'
        }`}
      >
        곡 추천하기
      </span>
    </button>
  );
}
