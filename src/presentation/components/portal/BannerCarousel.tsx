import { useState, useEffect, useRef } from 'react';
import type { Banner } from '../../../domain/entities/Banner.js';

interface BannerCarouselProps {
  banners: Banner[];
  loading: boolean;
  // 배너는 부가 콘텐츠라 실패해도 화면에는 아무것도 띄우지 않는다("배너를 못 불러왔습니다"는
  // 사용자에게 의미 없는 노이즈라서). 다만 실패를 삼키지는 않도록 여기까지 전달해두고,
  // 어떻게 알릴지(Sentry 보고 등)는 추후 결정한다.
  error?: Error | null;
}

export function BannerCarousel({ banners, loading }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const axisLockedRef = useRef<'h' | 'v' | null>(null);
  const isSwiping = useRef(false);
  const mouseStartXRef = useRef<number | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!banners.length) return; // 배너 도착 전(0개)이면 타이머를 돌리지 않음 — %0으로 인한 NaN 방지
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

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
      if (!axisLockedRef.current) {
        axisLockedRef.current = dx > dy ? 'h' : 'v';
      }
      if (axisLockedRef.current === 'h') {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartXRef.current;
      if (axisLockedRef.current === 'h' && Math.abs(delta) > 40) {
        isSwiping.current = true;
        setCurrent((prev) => (delta < 0 ? (prev + 1) % banners.length : (prev - 1 + banners.length) % banners.length));
        resetTimer();
        setTimeout(() => { isSwiping.current = false; }, 0);
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
  }, [banners.length]);

  const handleMouseDown = (e: React.MouseEvent) => { mouseStartXRef.current = e.clientX; };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartXRef.current === null) return;
    const delta = e.clientX - mouseStartXRef.current;
    if (Math.abs(delta) > 40) {
      isSwiping.current = true;
      setCurrent((prev) => (delta < 0 ? (prev + 1) % banners.length : (prev - 1 + banners.length) % banners.length));
      resetTimer();
      setTimeout(() => { isSwiping.current = false; }, 0);
    }
    mouseStartXRef.current = null;
  };
  const handleClick = (banner: Banner) => {
    if (isSwiping.current) return;
    if (banner.clickUrl) {
      window.open(banner.clickUrl, '_blank');
    }
  };

  // 스켈레톤 
  if (loading) {
    return (
      <div className="mb-3 mt-2">
        <div className="rounded-card aspect-[10/3] bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
      </div>
    );
  }

  // 배너 0개일때 
  if (!banners.length) return null;

  // 배너 1개 이상일때
  return (
    <div className="mb-3 mt-2 [animation:fadeIn_0.4s_ease-out]">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl aspect-[10/3]"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner, i) => (
            <img
              key={banner.id || i}
              src={banner.imageUrl}
              alt={banner.altText || '배너'}
              className={`w-full h-full object-cover flex-shrink-0 ${banner.clickUrl ? 'cursor-pointer' : ''}`}
              draggable={false}
              onClick={() => handleClick(banner)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
