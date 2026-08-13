// 컴포넌트: 셔틀 출발지 칩 선택 (고정 상단 헤더) + 자동선택 안내 툴팁
import { useState, useEffect, useRef } from 'react';
import { STOPS } from '../../../domain/entities/Shuttle.js';
import { ViewModeToggle } from './ViewModeToggle.jsx';
import styles from './StopSelector.module.css';

interface StopSelectorProps {
  viewMode: 'shuttle' | 'bus';
  setViewMode: (mode: 'shuttle' | 'bus') => void;
  stop: string;
  setStop: (stop: string) => void;
  isActive: boolean;
  isGpsLoading: boolean;
}

export function StopSelector({ viewMode, setViewMode, stop, setStop, isActive, isGpsLoading }: StopSelectorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipFadingOut, setIsTooltipFadingOut] = useState(false);
  const [tooltipStop, setTooltipStop] = useState(stop);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    // 컴포넌트는 앱 부팅 시 mount되므로(탭 전환은 display 토글) isActive 없이는
    // 타이머가 부팅 순간부터 돌아 사용자가 보기 전에 툴팁 일생이 끝나버린다
    if (!isActive || isGpsLoading) return;

    // 탭 진입 2초 후 띄우고, 8초 동안 유지 (총 10초 후 사라짐)
    const showTimer = setTimeout(() => {
      if (!hasInteractedRef.current) {
        setTooltipStop(stop); // 2초 뒤 툴팁 생성되는 찰나에 결정된 최신 자동선택 정류장으로 조립!
        setIsTooltipFadingOut(false); // 이전 사이클이 남긴 페이드아웃 상태 리셋 (안 하면 opacity-0으로 떠서 안 보임)
        setShowTooltip(true);
      }
    }, 2000);
    const hideTimer = setTimeout(() => {
      setIsTooltipFadingOut(true);
      setTimeout(() => setShowTooltip(false), 400);
    }, 10000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isActive, stop, isGpsLoading]); // stop 이 비동기로 변할 때 타이머가 돌고 있다면 최신값을 잡을 수 있게 반영

  const handleStopClick = (s: string) => {
    setStop(s);
    if (showTooltip) {
      setIsTooltipFadingOut(true);
      setTimeout(() => setShowTooltip(false), 400);
    }
    hasInteractedRef.current = true;
  };

  return (
    <div className="sticky top-0 bg-surface/80 backdrop-blur-xl z-[100] -mx-4 px-4 py-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl font-extrabold text-text-main">출발지</div>
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STOPS.map((s, idx) => (
          <div
            key={s}
            className={`py-[7px] px-2 text-center flex items-center justify-center gap-1 border-[1.5px] rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative ${stop === s
              ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(14,74,132,0.22)]'
              : 'border-slate-200 bg-white text-text-sub hover:bg-surface hover:border-slate-300'
              }`}
            onClick={() => handleStopClick(s)}
            style={{ position: 'relative' }}
          >
            {tooltipStop === s && showTooltip && (() => {
              const isTop = idx < 3 && s !== '셔틀콕' && s !== '한대앞';
              const arrowClass = isTop ? styles.top : styles.bottom;
              const posClass = isTop ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]';
              const anim = isTop ? 'tooltipPopSmall' : 'tooltipPopDownSmall';
              const fadeY = isTooltipFadingOut ? (isTop ? ' translateY(-0.5rem)' : ' translateY(0.5rem)') : '';
              const origin = isTop ? 'bottom center' : 'top center';
              return (
                <div
                  className={`${styles.tooltip} ${arrowClass} absolute left-1/2 bg-[rgba(33,37,41,0.9)] text-white px-3.5 py-2.5 rounded-card text-[11px] font-bold whitespace-nowrap shadow-[0_12px_24px_-6px_rgba(0,0,0,0.3)] z-[500] flex items-center pointer-events-none backdrop-blur-sm transition-all duration-400 ${isTooltipFadingOut ? 'opacity-0' : ''} ${posClass}`}
                  style={{ transform: `translateX(-50%) scale(0.85)${fadeY}`, transformOrigin: origin, animation: `${anim} 0.4s cubic-bezier(0.175,0.885,0.32,1.275)` }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  잠깐! 이 출발지가 맞나요?
                </div>
              );
            })()}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
