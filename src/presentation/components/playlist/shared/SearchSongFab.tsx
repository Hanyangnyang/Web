import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FAB_CLOSED_BOTTOM_PX, FAB_HEIGHT_PX, PLAYER_GAP_PX, findScrollParent } from './AddSongFab';

interface SearchSongFabProps {
  onClick: () => void;
  // FloatingSpotifyPlayer가 측정해서 올려준 실제 카드 높이(px). 0이면 플레이어 닫힘.
  playerHeight?: number;
}

const FAB_RIGHT = 'right-[max(1.25rem,calc((100vw-440px)/2+1.25rem))]';
// 곡 추천하기 FAB 바로 위에 쌓이는 보조 FAB — PlaylistView의 하단 여백 계산도 이 값을 같이 더함
export const SEARCH_FAB_GAP_PX = 12;
export const SEARCH_FAB_STACK_PX = FAB_HEIGHT_PX + SEARCH_FAB_GAP_PX;

// 곡 검색하기 FAB — 곡 추천하기 FAB(AddSongFab) 위에 같은 크기의 알약 모양으로 쌓임.
// 추천은 보라색, 검색은 검색바와 같은 브랜드 블루(playlist-primary)로 구분.
// 스크롤하면 추천하기 FAB과 같은 타이밍에 아이콘만 남도록 접히고, 맨 위로 돌아오면 다시 펼쳐짐
export function SearchSongFab({ onClick, playerHeight = 0 }: SearchSongFabProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const base =
    playerHeight > 0
      ? `${playerHeight}px + ${PLAYER_GAP_PX}px`
      : `${FAB_CLOSED_BOTTOM_PX}px`;

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
      aria-label="곡 검색하기"
      className={`fixed ${FAB_RIGHT} z-40 h-12 rounded-full bg-playlist-primary text-white border border-transparent flex items-center justify-center overflow-hidden shadow-[0_6px_20px_rgba(97,140,233,0.4)] hover:shadow-[0_8px_24px_rgba(97,140,233,0.5)] transition-[width,bottom,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 ${
        collapsed ? 'w-12' : 'w-[128px]'
      }`}
      style={{ bottom: `calc(${base} + ${SEARCH_FAB_STACK_PX}px + env(safe-area-inset-bottom))` }}
    >
      <Search size={20} strokeWidth={2.4} className="flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap text-[15px] font-bold transition-[max-width,opacity,margin-left] duration-200 ease-out ${
          collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[90px] opacity-100 ml-1.5'
        }`}
      >
        곡 검색하기
      </span>
    </button>
  );
}
