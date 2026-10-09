import { useState, useEffect, useRef } from 'react';
import { ArtistPromoBanner } from './ArtistPromoBanner.js';

export interface ArtistPromo {
  artistName: string;
  // 사진이 없는 가수는 null — 배너가 이니셜 기본 이미지로 표시
  artistImageUrl: string | null;
}

interface ArtistPromoCarouselProps {
  artists: readonly ArtistPromo[];
  // 눌린 장의 아티스트를 넘겨줘서, 그 아티스트 검색 화면으로 보낼 수 있게 한다
  onClick?: (artist: ArtistPromo) => void;
  // 소식 탭이 비활성(다른 탭 표시 중)일 때 자동 슬라이드 타이머를 멈추기 위해 씀
  isActive?: boolean;
}

const AUTO_SLIDE_MS = 7000;
const TRANSITION_MS = 300; // 아래 슬라이드 트랙의 duration-300과 반드시 일치해야 복제본 스냅백이 끊겨 보이지 않는다

// 소식탭 배너 캐러셀(BannerCarousel)과 같은 동작: 7초 자동 슬라이드, 좌우 스와이프, 끝에서 첫 장으로 이어지는 무한 루프, 점 인디케이터.
// 슬라이드 목록 끝에 첫 장을 복제해 두고, 복제본에 도달하면 트랜지션을 잠깐 끄고 0번으로 순간이동한다.
export function ArtistPromoCarousel({ artists, onClick, isActive = true }: ArtistPromoCarouselProps) {
  const count = artists.length;
  const [current, setCurrent] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const axisLockedRef = useRef<'h' | 'v' | null>(null);
  const isSwiping = useRef(false);
  const mouseStartXRef = useRef<number | null>(null);

  const slides = count > 1 ? [...artists, artists[0]] : artists;

  const goForward = () => {
    setTransitionEnabled(true);
    setCurrent((prev) => (prev >= count ? 1 : prev + 1));
  };
  const goBack = () => setCurrent((prev) => (prev - 1 + count) % count);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count <= 1 || !isActive) return;
    timerRef.current = setInterval(goForward, AUTO_SLIDE_MS);
  };

  const finishSwipe = (delta: number) => {
    isSwiping.current = true;
    if (delta < 0) goForward();
    else goBack();
    resetTimer();
    setTimeout(() => { isSwiping.current = false; }, 0);
  };

  useEffect(() => {
    // 다른 탭에 있다가 돌아왔을 때 항상 첫 장부터 다시 보여준다
    if (isActive) setCurrent(0);
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, isActive]);

  useEffect(() => {
    if (count <= 1 || current !== count) return;
    const t = setTimeout(() => {
      setTransitionEnabled(false);
      setCurrent(0);
    }, TRANSITION_MS);
    return () => clearTimeout(t);
  }, [current, count]);

  // 순간이동한 프레임이 실제로 그려진 뒤에 트랜지션을 다시 켠다 (같은 프레임에 켜면 순간이동이 애니메이션으로 보인다)
  useEffect(() => {
    if (transitionEnabled) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setTransitionEnabled(true)); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [transitionEnabled]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      axisLockedRef.current = null;
      isSwiping.current = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartXRef.current);
      const dy = Math.abs(e.touches[0].clientY - (touchStartYRef.current ?? 0));
      if (!axisLockedRef.current) axisLockedRef.current = dx > dy ? 'h' : 'v';
      if (axisLockedRef.current === 'h') e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartXRef.current;
      if (axisLockedRef.current === 'h' && Math.abs(delta) > 40) finishSwipe(delta);
      touchStartXRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [count, isActive]);

  const handleMouseDown = (e: React.MouseEvent) => { mouseStartXRef.current = e.clientX; };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartXRef.current === null) return;
    const delta = e.clientX - mouseStartXRef.current;
    if (Math.abs(delta) > 40) finishSwipe(delta);
    mouseStartXRef.current = null;
  };

  if (!count) return null;

  return (
    <div>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          className={`flex ${transitionEnabled ? 'transition-transform duration-300 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((artist, i) => (
            <div key={i === count ? `${artist.artistName}-clone` : artist.artistName} className="w-full flex-shrink-0">
              <ArtistPromoBanner
                artistName={artist.artistName}
                artistImageUrl={artist.artistImageUrl}
                onClick={onClick && (() => { if (!isSwiping.current) onClick(artist); })}
              />
            </div>
          ))}
        </div>

        {/* 인디케이터는 사진 안 하단 중앙에 겹쳐 둔다 — 어두운 배경 위라 흰색 */}
        {count > 1 && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5">
            {artists.map((artist, i) => (
              <span
                key={artist.artistName}
                className={`h-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-all duration-300 ${i === current % count ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
