// 컴포넌트: "학교 셔틀" 화면 전체 (출발지 선택 + 시간표 + 지하철 연결)
import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
import { STOPS, type ScheduleItem, type ShuttleAppConfig } from '../../../domain/entities/Shuttle.js';
import type { SubwayArrivalApiItem } from '../../../data/datasources/ShuttleDataSource.js';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ViewModeToggle } from './ViewModeToggle.jsx';
import { ShuttleSelector } from './ShuttleSelector.jsx';
import { SubwayDropdown } from './SubwayDropdown.jsx';
import { TimetableRow } from './TimetableRow.jsx';
import { NoticeBanner } from '../common/NoticeBanner.jsx';
import { getKSTToday } from '../../../utils/time.js';

interface PeriodScheduleItem {
  start: string;
  name: string;
}

type SchoolShuttleAppConfig = ShuttleAppConfig & { period_schedule?: PeriodScheduleItem[] };

interface SchoolShuttleSectionProps {
  isActive: boolean;
  viewMode: 'shuttle' | 'bus';
  setViewMode: (mode: 'shuttle' | 'bus') => void;
  stop: string;
  setStop: (stop: string) => void;
  lineId: string;
  setLineId: (lineId: string) => void;
  schedule: (ScheduleItem & { isLast?: boolean })[];
  nextIdx: number;
  now: number;
  subwayArrivals: SubwayArrivalApiItem[];
  subwayOffPeak: boolean;
  isHolidayServer: boolean | null;
  isWeekend: boolean;
  needsSubway: boolean;
  loadErr: string | null;
  isLoading: boolean;
  isSubwayLoading: boolean;
  isGpsLoading: boolean;
  visibleCount: number;
  loadMore: () => void;
  isFullMode: boolean;
  setIsFullMode: Dispatch<SetStateAction<boolean>>;
  fullDayType: string;
  setFullDayType: Dispatch<SetStateAction<string>>;
  fullPeriod: string;
  setFullPeriod: Dispatch<SetStateAction<string>>;
  appConfig: SchoolShuttleAppConfig;
}

export function SchoolShuttleSection({
  isActive,
  viewMode, setViewMode,
  stop, setStop,
  lineId, setLineId,
  schedule, nextIdx, now,
  subwayArrivals, subwayOffPeak,
  isHolidayServer, isWeekend,
  needsSubway,
  loadErr, isLoading, isSubwayLoading, isGpsLoading,
  visibleCount, loadMore,
  isFullMode, setIsFullMode,
  fullDayType, setFullDayType,
  fullPeriod, setFullPeriod,
  appConfig,
}: SchoolShuttleSectionProps) {
  const [triggerAutoFlip, setTriggerAutoFlip] = useState(false);

  // 칩(출발지)을 바꿀 때마다 30분 이내의 다음 셔틀 자동 뒤집기 트리거 실행
  useEffect(() => {
    if (isActive && !isLoading && schedule.length > 0) {
      setTriggerAutoFlip(true);
      const t = setTimeout(() => setTriggerAutoFlip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isActive, isLoading, stop]);

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipFadingOut, setIsTooltipFadingOut] = useState(false);
  const [tooltipStop, setTooltipStop] = useState(stop);
  const [justToggledFullMode, setJustToggledFullMode] = useState(false);
  const [subwayRedirecting, setSubwayRedirecting] = useState(false);
  const hasInteractedRef = useRef(false);

  const upcomingSchedule = (() => {
    if (!appConfig?.period_schedule || appConfig.period_schedule.length === 0) return null;
    const today = getKSTToday();

    const futureSchedules = appConfig.period_schedule.filter(item => {
      const parts = item.start.split('-');
      if (parts.length !== 3) return false;
      const startDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    });

    if (futureSchedules.length === 0) return null;

    futureSchedules.sort((a, b) => a.start.localeCompare(b.start));
    return futureSchedules[0];
  })();

  // upcomingSchedule이 있을 때 배너에 보여줄 "N월 N일부터 정규학기 시간표로 변경됩니다" 문구 조립
  const upcomingScheduleMessage = upcomingSchedule ? (() => {
    const parts = upcomingSchedule.start.split('-');
    let formattedStartDate = '';
    if (parts.length === 3) {
      const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const today = getKSTToday();

      const getMonday = (d: Date) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.getFullYear(), d.getMonth(), diff);
        monday.setHours(0, 0, 0, 0);
        return monday;
      };

      const todayMonday = getMonday(today);
      const targetMonday = getMonday(targetDate);

      const diffWeeks = Math.round((targetMonday.getTime() - todayMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
      const dayName = weekdays[targetDate.getDay()];

      if (diffWeeks === 0) {
        formattedStartDate = `이번 주 ${dayName}`;
      } else if (diffWeeks === 1) {
        formattedStartDate = `다음 주 ${dayName}`;
      } else {
        formattedStartDate = `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
      }
    }
    const nameMap: Record<string, string> = {
      '학기중': '정규학기',
      '방학중': '방학',
      '계절학기': '계절학기'
    };
    const periodDisplayName = nameMap[upcomingSchedule.name] || upcomingSchedule.name;

    return `${formattedStartDate}부터 ${periodDisplayName} 시간표로 변경됩니다 😊`;
  })() : null;

  const HIDE_COL_STOPS = ['한대앞', '셔틀콕 건너편', '예술인', '중앙역'];
  const hideSubwayCol = HIDE_COL_STOPS.includes(stop);

  // 스크롤 동기화 만료 처리 효과
  useEffect(() => {
    if (justToggledFullMode) {
      const timer = setTimeout(() => setJustToggledFullMode(false), 500);
      return () => clearTimeout(timer);
    }
  }, [justToggledFullMode]);

  // 사용자가 외부 카카오 지도 이동 후 브라우저로 돌아왔을 때 스피너를 복구시킵니다.
  useEffect(() => {
    if (!subwayRedirecting) return;

    const handleFocus = () => setSubwayRedirecting(false);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [subwayRedirecting]);

  // 출발지 칩(stop) 이나 학기/요일 필터 변경 시 전체 시간표 스크롤을 맨 위(첫차)로 초기화
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isFullMode && containerRef.current) {
      const getScrollParent = (node: Node | null): Element | null => {
        if (node == null || !(node instanceof HTMLElement)) return null;
        if (node.scrollHeight > node.clientHeight) {
          const style = window.getComputedStyle(node);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return node;
          }
        }
        return getScrollParent(node.parentNode) || document.documentElement || document.body;
      };

      const scrollParent = getScrollParent(containerRef.current);
      if (scrollParent) {
        if (scrollParent === document.documentElement || scrollParent === document.body) {
          window.scrollTo(0, 0);
        } else {
          scrollParent.scrollTop = 0;
        }
      }
    }
  }, [stop, fullDayType, fullPeriod, lineId, isFullMode]);

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

  if (loadErr) {
    return (
      <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>{loadErr}</p></div></div>
    );
  }

  if (isLoading) {
    return (
      <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>불러오는 중…</p></div></div>
    );
  }

  return (
    <div className="pb-36 [animation:slideUp_0.4s_ease-out]">
      {/* 출발지 선택 (고정 상단) */}
      <div className="sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-xl z-[100] -mx-4 px-4 py-4 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-3">
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
                : 'border-[#e2e8f0] bg-white text-text-sub hover:bg-surface hover:border-[#cbd5e1]'
                }`}
              onClick={() => handleStopClick(s)}
              style={{ position: 'relative' }}
            >
              {tooltipStop === s && showTooltip && (() => {
                const isTop = idx < 3 && s !== '셔틀콕' && s !== '한대앞';
                const arrowClass = isTop ? 'top' : 'bottom';
                const posClass = isTop ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]';
                const anim = isTop ? 'tooltipPopSmall' : 'tooltipPopDownSmall';
                const fadeY = isTooltipFadingOut ? (isTop ? ' translateY(-0.5rem)' : ' translateY(0.5rem)') : '';
                const origin = isTop ? 'bottom center' : 'top center';
                return (
                  <div
                    className={`stt-tooltip ${arrowClass} absolute left-1/2 bg-[rgba(33,37,41,0.9)] text-white px-3.5 py-2.5 rounded-card text-[11px] font-bold whitespace-nowrap shadow-[0_12px_24px_-6px_rgba(0,0,0,0.3)] z-[500] flex items-center pointer-events-none backdrop-blur-sm transition-all duration-400 ${isTooltipFadingOut ? 'opacity-0' : ''} ${posClass}`}
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

      {/* 다가오는 시간표 변경 안내 배너 — 한번 뜨면 대상 기간이 될 때까지 계속 유지 */}
      <NoticeBanner shouldShow={isActive && !!upcomingSchedule} message={upcomingScheduleMessage ?? ''} persistOnceShown />

      {/* 시간표 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-shrink-0 whitespace-nowrap flex items-center text-2xl font-extrabold text-text-main">시간표</div>

          <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
            <div className="shrink basis-[125px] min-w-0">
              <ShuttleSelector
                isFullMode={isFullMode}
                fullPeriod={fullPeriod}
                setFullPeriod={setFullPeriod}
                fullDayType={fullDayType}
                setFullDayType={setFullDayType}
                appConfig={appConfig}
                isHolidayServer={isHolidayServer}
                isWeekend={isWeekend}
              />
            </div>
            {needsSubway && (
              <div className="shrink-0 min-w-0">
                <SubwayDropdown selected={lineId} onChange={setLineId} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center py-0 pb-1.5 border-b border-[#f1f5f9]" style={{ gap: 'clamp(6px, 3vw, 16px)', paddingRight: 8 }}>
          {!hideSubwayCol && (
            needsSubway ? (
              <button
                onClick={async () => {
                  const is4Line = lineId.startsWith('line4-');
                  const cacheBuster = new Date().getTime();
                  const url = `https://place.map.kakao.com/${is4Line ? 'SES1755' : 'SES44M235'}?t=${cacheBuster}`;
                  if (Capacitor.isNativePlatform()) {
                    try {
                      const platform = Capacitor.getPlatform();
                      if (platform === 'android') {
                        // @capacitor/app 8.1.0 타입 정의(및 실제 구현)에 openUrl이 없음 — 항상 여기서 던지고
                        // 아래 catch의 window.open()으로 폴백되는 것으로 보임(동작은 원본 그대로 유지, 별도 확인 필요)
                        await (App as unknown as { openUrl: (options: { url: string }) => Promise<void> }).openUrl({ url });
                      } else {
                        await Browser.open({ url, presentationStyle: 'popover', toolbarColor: '#FFFFFF' });
                      }
                    } catch (err) {
                      window.open(url, '_blank');
                    }
                  } else {
                    setSubwayRedirecting(true);
                    setTimeout(() => { window.location.href = url; }, 1200);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.01em',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginLeft: 'auto',
                }}
              >
                카카오 지하철
                <ArrowUpRight size={10} strokeWidth={2.2} />
              </button>
            ) : (
              <span className="text-[10px] font-bold text-[#cbd5e1] tracking-[0.04em] flex-shrink-0" style={{ marginLeft: 'auto' }}>도착</span>
            )
          )}
          <div className={`flex items-center gap-1.5 flex-shrink-0${hideSubwayCol ? ' ml-auto' : ''}`}>
            <div
              onClick={() => {
                if (!isFullMode) setJustToggledFullMode(true);
                setIsFullMode(!isFullMode);
              }}
              style={{ width: 38, height: 21, borderRadius: 20, padding: 2, cursor: 'pointer', background: isFullMode ? 'var(--color-primary)' : '#e0e0e0', position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)', flexShrink: 0 }}
            >
              <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'white', boxShadow: '0 2px 3px rgba(0,0,0,0.15)', position: 'absolute', top: 2, left: isFullMode ? 19 : 2, transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: isFullMode ? 'var(--color-primary)' : 'var(--color-text-hint)', whiteSpace: 'nowrap' }}>
              전체 시간표
            </span>
          </div>
        </div>

        <div ref={containerRef} className="bg-white border border-[#e2e8f0] rounded-card overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
          {schedule.length > 0 ? (() => {
            const fullActiveIdx = isFullMode ? schedule.findIndex(r => r.depMin >= now) : -1;
            return (isFullMode ? schedule : schedule.slice(0, visibleCount)).map((row, i) => (
              <TimetableRow
                key={`${stop}-${i}`}
                row={row}
                lineId={lineId}
                isNext={!isFullMode && i === nextIdx && nextIdx !== -1}
                isLast={row.isLast || i === schedule.length - 1}
                isPast={!isFullMode && row.depMin < now}
                subwayArrivals={subwayArrivals}
                subwayOffPeak={subwayOffPeak}
                isSubwayLoading={isSubwayLoading}
                hideSubwayCol={hideSubwayCol}
                now={now}
                isFullMode={isFullMode}
                isActiveInFull={isFullMode && i === fullActiveIdx}
                shouldScroll={justToggledFullMode}
                autoFlip={triggerAutoFlip}
              />
            ));
          })() : (
            <div className="min-h-[425px] flex flex-col justify-center py-8 text-center text-text-sub font-semibold">
              <p>{isFullMode ? '운행 정보가 없습니다' : '오늘 남은 셔틀이 없습니다'}</p>
            </div>
          )}
        </div>

        {!isFullMode && schedule.length > visibleCount && (
          <div className="flex justify-center py-4">
            <button
              className="bg-transparent border border-[#cbd5e1] text-text-sub rounded-full px-6 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2 hover:bg-surface"
              onClick={loadMore}
            >
              <ChevronDown size={16} />
              더 불러오기
            </button>
          </div>
        )}
      </div>

      {/* 실시간 지하철 정보 페이지 리다이렉팅 로딩 뷰 */}
      {subwayRedirecting && (
        <div
          className="fixed inset-0 bg-[rgba(15,23,42,0.78)] backdrop-blur-[6px] z-[10000] flex flex-col justify-center items-center gap-4 text-center select-none"
          style={{ animation: 'sttFadeIn 0.25s ease-out' }}
        >
          <div className="w-12 h-12 border-[3.5px] border-white/10 rounded-full border-t-primary animate-[spin_0.8s_linear_infinite] mb-2" />
          <p className="text-white text-[1.05rem] font-bold tracking-tight leading-snug whitespace-pre-line">
            카카오 지하철로 이동할게요!
          </p>
          <p className="text-white/40 text-[0.78rem] font-medium tracking-wide">
            잠시만 기다려 주세요
          </p>
        </div>
      )}
    </div>
  );
}
