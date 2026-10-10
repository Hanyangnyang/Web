import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { findScrollableAncestor } from '../../../../utils/scroll';
// 이만큼(px) 이상 내려오면 보임 — 첫 화면 몇 장 분량을 넘겨야 "맨 위로"가 필요해짐
const SHOW_AFTER_PX = 600;

// "맨 위로" 알약 버튼 — 목록 화면의 고정 헤더(sticky) 안에 두면 헤더 바로 아래 가운데에 떠서 따라다님.
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
      className={`absolute before:content-[''] before:absolute before:-inset-y-3 before:-inset-x-2 left-1/2 top-full mt-2 -translate-x-1/2 flex items-center gap-1 h-8 px-3 rounded-full bg-[rgba(15,23,42,0.85)] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <ArrowUp size={14} strokeWidth={2.5} />
      맨 위로
    </button>
  );
}
