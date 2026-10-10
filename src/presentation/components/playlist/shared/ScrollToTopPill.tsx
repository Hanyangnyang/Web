import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { findScrollableAncestor } from '../../../../utils/scroll';
// 이만큼(px) 이상 내려오면 보임 — 첫 화면 몇 장 분량을 넘겨야 "맨 위로"가 필요해짐
const SHOW_AFTER_PX = 600;

// "맨 위로" 알약 버튼 — 화면 하단 가운데에 고정으로 떠서 따라다님(하단 플레이어가 열려 있으면 그 위로 올라감).
// 헤더의 backdrop-blur가 fixed의 기준 박스를 바꿔버려서, 목록 화면 최상위(헤더 밖)에 둬야 뷰포트 기준으로 뜸.
// 가장 가까운 스크롤 컨테이너를 스스로 찾아 스크롤 위치를 보고, 일정 이상 내려오면 나타났다가 맨 위에 오면 사라짐
export function ScrollToTopPill() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scroller = findScrollableAncestor(buttonRef.current);
    if (!scroller) return;
    const handleScroll = () => setVisible(scroller.scrollTop > SHOW_AFTER_PX);
    handleScroll();
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    findScrollableAncestor(buttonRef.current)?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-label="맨 위로 이동"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{ bottom: 'calc(max(var(--playlist-player-height, 0px) + 16px, 20px) + env(safe-area-inset-bottom))' }}
      className={`fixed before:content-[''] before:absolute before:-inset-5 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-1.5 h-11 px-3.5 rounded-full bg-[rgba(15,23,42,0.88)] text-white shadow-[0_6px_18px_rgba(0,0,0,0.2)] text-[16px] font-semibold transition-all duration-200 active:scale-95 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <ArrowUp size={18} strokeWidth={2.5} />
      맨 위로
    </button>
  );
}
