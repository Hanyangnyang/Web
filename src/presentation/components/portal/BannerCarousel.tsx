import { useState, useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import type { Banner } from '../../../domain/entities/Banner.js';

// BottomNav가 실제로 그리는 탭 키 목록 — clickUrl의 tab 파라미터에 오타/미지원 값이 오면
// 그대로 setActiveTab에 흘려보내 모든 탭이 안 그려지는 빈 화면이 되는 걸 막는다
const VALID_TABS = ['cafe', 'shuttle', 'portal', 'partner', 'misc'];

interface BannerCarouselProps {
  banners: Banner[];
  loading: boolean;
  error?: Error | null;
  // 소식 탭이 비활성(다른 탭 표시 중)일 때 자동 슬라이드 타이머를 멈추기 위해 씀
  isActive?: boolean;
  // 배너가 앱 내부 탭(예: 캠퍼스맵)으로 이동하는 링크일 때 새 창을 열지 않고 바로 탭을 전환하기 위해 씀
  onNavigateToTab?: (tab: string) => void;
}

export function BannerCarousel({ banners, loading, isActive = true, onNavigateToTab }: BannerCarouselProps) {
  const posthog = usePostHog();
  const [current, setCurrent] = useState(0);
  // 마지막 배너 다음에 첫 배너로 "이어서 왼쪽으로" 넘어가는 것처럼 보이려고, 슬라이드 목록 끝에
  // 첫 배너를 하나 더 복제해 둔다(2개 이상일 때만). current가 그 복제본(banners.length번째)에
  // 도달하면 transitionEnabled를 잠깐 꺼서 티 안 나게 0번으로 순간 이동시킨 뒤 다시 켠다.
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const axisLockedRef = useRef<'h' | 'v' | null>(null);
  const isSwiping = useRef(false);
  const mouseStartXRef = useRef<number | null>(null);

  const slides = banners.length > 1 ? [...banners, banners[0]] : banners;

  const goForward = () => {
    setTransitionEnabled(true);
    // 복제본(clone) 위에 떠 있는 상태에서 또 넘기면(스냅백 전) 그다음 실제 슬라이드로 보낸다
    setCurrent((prev) => (prev >= banners.length ? 1 : prev + 1));
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length <= 1 || !isActive) return; // 배너가 0~1개거나 탭이 비활성이면 타이머를 돌릴 필요 없음
    timerRef.current = setInterval(goForward, 7000);
  };

  useEffect(() => {
    // 다른 탭에 있다가 소식 탭으로 돌아왔을 때, 떠나기 전 위치가 아니라 항상 첫 배너부터 다시 보여준다
    if (isActive) setCurrent(0);
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length, isActive]);

  // current가 복제본(banners.length번째) 위치에 도달하면, 트랜지션이 끝날 시점에
  // 애니메이션 없이 진짜 0번으로 되돌려서 무한 루프처럼 보이게 한다
  useEffect(() => {
    if (banners.length <= 1 || current !== banners.length) return;
    const t = setTimeout(() => {
      setTransitionEnabled(false);
      setCurrent(0);
    }, 300); // 아래 슬라이드 트랙의 transition duration(300ms)과 반드시 일치해야 끊김이 안 보인다
    return () => clearTimeout(t);
  }, [current, banners.length]);

  // 트랜지션 없이 순간이동한 프레임이 실제로 그려진 뒤에 다시 트랜지션을 켠다
  // (같은 프레임에서 바로 켜면 순간이동 자체가 애니메이션으로 보일 수 있어 rAF를 두 번 거친다)
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
        if (delta < 0) goForward();
        else setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
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
      if (delta < 0) goForward();
      else setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
      resetTimer();
      setTimeout(() => { isSwiping.current = false; }, 0);
    }
    mouseStartXRef.current = null;
  };
  const handleClick = (banner: Banner) => {
    if (isSwiping.current) return;
    if (!banner.clickUrl) return;

    posthog?.capture('banner_clicked', { banner_id: banner.id, banner_alt_text: banner.altText, click_url: banner.clickUrl });

    // 우리 앱 자신을 가리키는 링크(예: https://hanyang.life/?tab=partner)면 새 창/브라우저를 열지 않고
    // 바로 그 탭으로 전환한다 — 네이티브에서는 window.open이 외부 브라우저로 튀어나가버리기 때문
    try {
      const url = new URL(banner.clickUrl, window.location.origin);
      const tab = url.searchParams.get('tab');
      if (onNavigateToTab && tab && VALID_TABS.includes(tab) && url.origin === window.location.origin) {
        onNavigateToTab(tab);
        return;
      }
    } catch {
      // clickUrl이 URL로 파싱 안 되면 아래에서 그대로 외부 링크 취급
    }

    window.open(banner.clickUrl, '_blank');
  };

  // 1. 스켈레톤 
  if (loading) {
    return (
      <div>
        <div className="rounded-card aspect-[10/3] bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
      </div>
    );
  }

  // 2. 배너 0개일때 
  if (!banners.length) return null;

  // 3. 배너 1개 이상일때
  return (
    <div className="[animation:fadeIn_0.4s_ease-out]">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl aspect-[10/3]"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          className={`flex h-full ${transitionEnabled ? 'transition-transform duration-300 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((banner, i) => (
            <img
              key={i === banners.length ? `${banner.id ?? i}-clone` : (banner.id ?? i)}
              src={banner.imageUrl}
              alt={banner.altText || '배너'}
              className={`w-full h-full object-cover flex-shrink-0 ${banner.clickUrl ? 'cursor-pointer' : ''}`}
              draggable={false}
              onClick={() => handleClick(banner)}
            />
          ))}
        </div>
      </div>

      {/* 배너 개수 표시 — 1개일 땐 표시할 의미가 없어 생략 */}
      {banners.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-2">
          {banners.map((banner, i) => (
            <span
              key={banner.id ?? i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current % banners.length ? 'w-4 bg-text-main' : 'w-1.5 bg-slate-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
