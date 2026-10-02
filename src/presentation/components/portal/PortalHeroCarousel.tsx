import { useEffect, useRef, useState, type ReactNode } from 'react';

const SWIPE_THRESHOLD = 40; // 이 픽셀 이상 가로로 움직여야 스와이프로 인정 (BannerCarousel과 동일 기준)
const AUTO_SLIDE_INTERVAL = 10000; // 자동 슬라이드 간격(ms)

interface PortalHeroCarouselProps {
  slides: ReactNode[];
  // 소식 탭이 비활성일 때 있다가 다시 돌아오면 항상 첫 슬라이드부터 보여주기 위해 씀 (BannerCarousel과 동일)
  isActive?: boolean;
  // false면 타이머를 아예 돌리지 않는다 — 스와이프로 직접 넘기는 것만 동작 (기본값 true)
  autoPlay?: boolean;
}

// 소식탭 상단 캐러셀 — BannerCarousel과 동일한 동작(좌우 스와이프 + 10초 자동 재생, 항상 오른쪽에서
// 왼쪽으로만 넘어가고 마지막에서 처음으로 자연스럽게 이어짐)을 이미지가 아닌 임의의 컴포넌트로 구현한 버전.
// 마지막 슬라이드 다음에 첫 슬라이드를 하나 더 복제해 둔 뒤, 그 복제본에 도달하면 트랜지션을 잠깐 끄고
// 티 안 나게 진짜 0번으로 순간 이동시키는 방식도 BannerCarousel과 동일 (goForward 주석 참고)
export function PortalHeroCarousel({ slides, isActive = true, autoPlay = true }: PortalHeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const axisLockedRef = useRef<'h' | 'v' | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  // 스와이프 직후 발생하는 click을 눌러서, 드래그 종료 지점에 있던 슬라이드가 실수로 탭되는 걸 막는다
  const isSwipingRef = useRef(false);

  const renderSlides = slides.length > 1 ? [...slides, slides[0]] : slides;

  const goForward = () => {
    setTransitionEnabled(true);
    // 복제본(clone) 위에 떠 있는 상태에서 또 넘기면(스냅백 전) 그다음 실제 슬라이드로 보낸다
    setCurrent((prev) => (prev >= slides.length ? 1 : prev + 1));
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!autoPlay || slides.length <= 1 || !isActive) return; // 자동재생이 꺼져있거나, 슬라이드가 0~1개거나, 탭이 비활성이면 타이머를 돌릴 필요 없음
    timerRef.current = setInterval(goForward, AUTO_SLIDE_INTERVAL);
  };

  useEffect(() => {
    // 다른 탭에 있다가 소식 탭으로 돌아왔을 때, 떠나기 전 위치가 아니라 항상 첫 슬라이드부터 다시 보여준다
    if (isActive) setCurrent(0);
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, isActive, autoPlay]);

  // current가 복제본(slides.length번째) 위치에 도달하면, 트랜지션이 끝날 시점에
  // 애니메이션 없이 진짜 0번으로 되돌려서 무한 루프처럼 보이게 한다
  useEffect(() => {
    if (slides.length <= 1 || current !== slides.length) return;
    const t = setTimeout(() => {
      setTransitionEnabled(false);
      setCurrent(0);
    }, 300); // 아래 슬라이드 트랙의 transition duration(300ms)과 반드시 일치해야 끊김이 안 보인다
    return () => clearTimeout(t);
  }, [current, slides.length]);

  // 트랜지션 없이 순간이동한 프레임이 실제로 그려진 뒤에 다시 트랜지션을 켠다
  useEffect(() => {
    if (transitionEnabled) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setTransitionEnabled(true)); });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [transitionEnabled]);

  const applySwipe = (delta: number) => {
    if (Math.abs(delta) <= SWIPE_THRESHOLD) return;
    isSwipingRef.current = true;
    if (delta < 0) goForward();
    else setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    resetTimer();
    setTimeout(() => { isSwipingRef.current = false; }, 0);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      axisLockedRef.current = null;
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
      if (axisLockedRef.current === 'h') {
        applySwipe(e.changedTouches[0].clientX - touchStartXRef.current);
      }
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
  }, [slides.length]);

  const handleMouseDown = (e: React.MouseEvent) => { mouseStartXRef.current = e.clientX; };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartXRef.current === null) return;
    applySwipe(e.clientX - mouseStartXRef.current);
    mouseStartXRef.current = null;
  };
  // 캡처 단계에서 가로채서 슬라이드(버튼 등) 내부의 onClick까지 도달하기 전에 막는다
  const handleClickCapture = (e: React.MouseEvent) => {
    if (isSwipingRef.current) e.stopPropagation();
  };

  return (
    <div className="-mt-3">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-card"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClickCapture={handleClickCapture}
      >
        <div
          className={`flex items-stretch ${transitionEnabled ? 'transition-transform duration-300 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {/* height는 지정하지 않는다 — items-stretch가 이 항목을 트랙의 최대 높이(현재는 날씨 카드)에
              맞춰 자동으로 늘려준다. 여기에 h-full을 직접 주면 그 stretch가 깨져서 반대로 짧아진다 */}
          {renderSlides.map((slide, i) => (
            <div key={i} className="w-full flex-shrink-0">{slide}</div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current % slides.length ? 'w-4 bg-text-main' : 'w-1.5 bg-slate-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
