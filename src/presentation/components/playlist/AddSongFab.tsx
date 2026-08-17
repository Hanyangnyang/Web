import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AddSongFabProps {
  onClick?: () => void;
  // true면 플로팅 플레이어 위(우측 상단)로, false면 화면 하단 우측으로 애니메이션과 함께 이동
  playerOpen?: boolean;
}

// 열림/닫힘 상태 관계없이 화면 끝에서 항상 1rem 여백
const FAB_RIGHT = 'right-[max(1rem,calc((100vw-440px)/2+1rem))]';
const CLOSED_BOTTOM = 'calc(24px + env(safe-area-inset-bottom))';
// 플레이어 카드 높이(헤더 ~52px + iframe 152px) + 여백 16px 위에 떠 있도록
const OPEN_BOTTOM = 'calc(204px + env(safe-area-inset-bottom) + 16px)';

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

export function AddSongFab({ onClick, playerOpen = false }: AddSongFabProps) {
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
      className={`fixed ${FAB_RIGHT} z-40 h-12 rounded-full bg-white text-gray-900 ring-1 ring-gray-900 flex items-center justify-center overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-[width,bottom,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 ${
        collapsed ? 'w-12' : 'w-[128px]'
      }`}
      style={{ bottom: playerOpen ? OPEN_BOTTOM : CLOSED_BOTTOM }}
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
