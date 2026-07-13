import React, { useState, useEffect, useRef } from 'react';

import { Info, Bell } from 'lucide-react';
import { usePortalData } from '../hooks/usePortalData.js';
import { useBanners } from '../hooks/useBanners.js';
import { WeatherAlarmSettings } from './WeatherAlarmSettings.jsx';
import { WeatherCard } from './WeatherCard.jsx';

function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const axisLockedRef = useRef(null); // 'h' | 'v' | null
  const isSwiping = useRef(false);
  const mouseStartXRef = useRef(null);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      axisLockedRef.current = null;
      isSwiping.current = false;
    };

    const onTouchMove = (e) => {
      if (touchStartXRef.current === null) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartXRef.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartYRef.current);
      if (!axisLockedRef.current) {
        axisLockedRef.current = dx > dy ? 'h' : 'v';
      }
      if (axisLockedRef.current === 'h') {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e) => {
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



  const handleMouseDown = (e) => { mouseStartXRef.current = e.clientX; };
  const handleMouseUp = (e) => {
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

  const handleClick = (banner) => {
    if (isSwiping.current) return;
    if (banner.click_url) {
      window.open(banner.click_url, '_blank');
    }
  };

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
              src={banner.image_url}
              alt={banner.alt_text || '배너'}
              className={`w-full h-full object-cover flex-shrink-0 ${banner.click_url ? 'cursor-pointer' : ''}`}
              draggable={false}
              onClick={() => handleClick(banner)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

export function PortalView({ isVisible = true }) {
  const { weather, library, loading } = usePortalData(isVisible);
  const [showWeatherAlarm, setShowWeatherAlarm] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');
  const { banners, loading: bannersLoading } = useBanners(isVisible);

  return (
    <>
      <button
        className="fixed bottom-[calc(20px+64px+12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
        onClick={() => setShowWeatherAlarm(true)}
      >
        <Bell size={18} />
        날씨 알림 받기
      </button>
      {showWeatherAlarm && (
        <WeatherAlarmSettings onClose={(msg) => {
          setShowWeatherAlarm(false);
          if (msg) {
            setAlarmPopup(msg);
            setTimeout(() => setAlarmPopup(''), 1500);
          }
        }} />
      )}
      {alarmPopup && (
        <div className="fixed bottom-[calc(20px+64px+60px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[1000] whitespace-pre-line text-center copy-toast">
          {alarmPopup}
        </div>
      )}

      <div className="pb-24 relative [animation:slideUp_0.4s_ease-out]">
        {/* 1. 에리카 날씨 섹션 */}
        <WeatherCard weather={weather} loading={loading} isVisible={isVisible} />

      {(loading || bannersLoading) ? (
        <div className="mb-3 mt-2">
          <div className="rounded-card aspect-[10/3] bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
        </div>
      ) : banners.length > 0 ? (
        <BannerCarousel banners={banners} />
      ) : null}

      {/* 2. 열람실 혼잡도 섹션 */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-text-main mb-2">학정 혼잡도</h3>
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-card border border-[#e2e8f0] p-4 flex flex-col gap-3 animate-pulse">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
                  <div className="h-4 w-10 bg-slate-100 rounded-md flex-shrink-0" />
                </div>
                <div className="mt-auto">
                  <div className="w-full h-2 bg-slate-100 rounded-full" />
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="h-3 w-16 bg-slate-100 rounded-full" />
                    <div className="h-3 w-12 bg-slate-100 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : library?.list ? (
            library.list.map((room) => {
              const emptySeats = Math.max(0, room.total - room.occupied);
              return (
                <div key={room.id} className="bg-white rounded-card border border-[#e2e8f0] p-4 flex flex-col gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="font-black text-[0.95rem] text-text-main leading-tight truncate flex-1 min-w-0">
                      {room.name.replace(' (2F)', '').replace(' (4F)', '')}
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0" style={{
                      backgroundColor: `${room.color}15`,
                      color: room.color,
                      border: `1px solid ${room.color}25`
                    }}>
                      {room.emoji} {room.status}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)" style={{
                        width: `${room.ratio * 100}%`,
                        backgroundColor: room.color
                      }} />
                    </div>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-[12px] text-[#334155] font-black">
                        {emptySeats}석 남음
                      </span>
                      <span className="text-[11px] text-[#475569] font-bold">
                        {room.occupied} / {room.total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 bg-white rounded-card border border-[#e2e8f0] py-8 flex flex-col items-center gap-2 shadow-sm opacity-80">
              <Info size={20} className="text-text-hint" />
              <p className="text-center text-text-sub text-sm font-semibold">혼잡도 정보를 불러올 수 없습니다</p>
            </div>
          )}
        </div>
      </section>
      </div>
    </>
  );
}
