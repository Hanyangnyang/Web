// 컴포넌트: "학교 셔틀" 화면 전체 (출발지 선택 + 시간표 + 지하철 연결)
import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ScheduleItem, ShuttleAppConfig } from '../../../domain/entities/Shuttle.js';
import type { SubwayArrivalApiItem } from '../../../data/datasources/ShuttleDataSource.js';
import { TimetableRow } from './TimetableRow.jsx';
import { NoticeBanner } from '../ui/NoticeBanner.jsx';
import { StopSelector } from './StopSelector.jsx';
import { TimetableHeader } from './TimetableHeader.jsx';
import { SubwayRedirectOverlay } from './SubwayRedirectOverlay.jsx';
import { openKakaoSubway } from './kakaoSubway.js';
import { findUpcomingSchedule, formatUpcomingScheduleMessage, type PeriodScheduleItem } from './upcomingSchedule.js';
import { getKSTToday } from '../../../utils/time.js';

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

  const [justToggledFullMode, setJustToggledFullMode] = useState(false);
  const [subwayRedirecting, setSubwayRedirecting] = useState(false);

  const today = getKSTToday();
  const upcomingSchedule = findUpcomingSchedule(appConfig?.period_schedule, today);
  const upcomingScheduleMessage = upcomingSchedule ? formatUpcomingScheduleMessage(upcomingSchedule, today) : null;

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

  const handleToggleFullMode = () => {
    if (!isFullMode) setJustToggledFullMode(true);
    setIsFullMode(!isFullMode);
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
      <StopSelector
        viewMode={viewMode}
        setViewMode={setViewMode}
        stop={stop}
        setStop={setStop}
        isActive={isActive}
        isGpsLoading={isGpsLoading}
      />

      {/* 다가오는 시간표 변경 안내 배너 — 한번 뜨면 대상 기간이 될 때까지 계속 유지 */}
      <NoticeBanner shouldShow={isActive && !!upcomingSchedule} message={upcomingScheduleMessage ?? ''} persistOnceShown />

      {/* 시간표 */}
      <div className="mb-6">
        <TimetableHeader
          isFullMode={isFullMode}
          fullPeriod={fullPeriod}
          setFullPeriod={setFullPeriod}
          fullDayType={fullDayType}
          setFullDayType={setFullDayType}
          appConfig={appConfig}
          isHolidayServer={isHolidayServer}
          isWeekend={isWeekend}
          needsSubway={needsSubway}
          hideSubwayCol={hideSubwayCol}
          lineId={lineId}
          setLineId={setLineId}
          onOpenSubway={() => openKakaoSubway(lineId, () => setSubwayRedirecting(true))}
          onToggleFullMode={handleToggleFullMode}
        />

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

      <SubwayRedirectOverlay visible={subwayRedirecting} />
    </div>
  );
}
