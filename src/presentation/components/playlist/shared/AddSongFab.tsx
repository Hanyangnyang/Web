import { PenLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Coachmark, useCoachmark } from './Coachmark';

interface AddSongFabProps {
  onClick?: () => void;
  // FloatingSpotifyPlayer가 측정해서 올려준 실제 카드 높이(px). 0이면 플레이어 닫힘.
  playerHeight?: number;
  // 곡 추천하기 말풍선을 띄워도 되는 화면인지 — 홈에서만 true. 검색 화면 등으로 바로 들어온 사람에겐 안 띄움
  showCoachmark?: boolean;
}

// 곡 추천하기 FAB 말풍선을 한 번 봤는지 — 다시 안 뜨게 기기에 남겨둔다
const FAB_COACHMARK_SEEN_KEY = 'addSongFabCoachmarkSeen';
const FAB_RIGHT = 'right-[max(1.25rem,calc((100vw-440px)/2+1.25rem))]';
// 다른 화면들(RecommendSongView의 등록하기 버튼, PlaylistView의 하단 여백 계산 등)도 이 FAB의 실제
// 크기/위치와 겹치지 않으려면 같은 값을 알아야 해서 export — 값이 바뀌면 여기 한 곳만 고치면 됨
export const FAB_HEIGHT_PX = 48; // h-12
export const FAB_CLOSED_BOTTOM_PX = 20; // 1.25rem
export const PLAYER_GAP_PX = 16; // 플레이어 카드 위 간격
const CLOSED_BOTTOM = `calc(${FAB_CLOSED_BOTTOM_PX}px + env(safe-area-inset-bottom))`;

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

export function AddSongFab({ onClick, playerHeight = 0, showCoachmark = false }: AddSongFabProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const coachmark = useCoachmark(FAB_COACHMARK_SEEN_KEY, showCoachmark);
  const bottom =
    playerHeight > 0
      ? `calc(${playerHeight}px + ${PLAYER_GAP_PX}px + env(safe-area-inset-bottom))`
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
    <>
    <button
      ref={buttonRef}
      onClick={onClick}
      aria-label="곡 추천하기"
      className={`fixed ${FAB_RIGHT} z-40 h-12 rounded-full bg-playlist-accent text-white border border-transparent flex items-center justify-center overflow-hidden shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_8px_24px_rgba(139,92,246,0.45)] transition-[width,bottom,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-90 ${
        collapsed ? 'w-12' : 'w-[128px]'
      }`}
      style={{ bottom }}
    >
      <PenLine size={20} strokeWidth={2.2} className="flex-shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-bold transition-[max-width,opacity,margin-left] duration-200 ease-out ${
          collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[90px] opacity-100 ml-1.5'
        }`}
      >
        곡 추천하기
      </span>
    </button>
    {/* 처음 온 사람에게 FAB의 역할을 알려주는 말풍선 — FAB 바로 위, 꼬리는 FAB을 향함 */}
    <Coachmark
      {...coachmark}
      tail="bottom"
      zClassName="z-[150]"
      tailClassName="right-[54px]"
      className={`fixed ${FAB_RIGHT}`}
      style={{ bottom: `calc(${bottom} + ${FAB_HEIGHT_PX}px + 10px)` }}
    >
      추천하고 싶은 곡을 추천해봐요!🎵
    </Coachmark>
    </>
  );
}
