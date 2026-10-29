// 컴포넌트: "학교 셔틀" 화면 전체 (출발지 선택 + 시간표 + 지하철 연결)
import { useState, useEffect, useLayoutEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { Bus, ChevronDown } from 'lucide-react';
import type { ScheduleItem, ShuttleAppConfig, ShuttleEmptyState } from '../../../domain/entities/Shuttle.js';
import { SUBWAY_OPTS, isSubwayScheduleMissing, type SubwayScheduleRow } from '../../../domain/entities/Subway.js';
import { TimetableRow, TimetableRowSkeleton } from './TimetableRow.jsx';
import { NoticeBanner } from '../ui/NoticeBanner.jsx';
import { CardFallback } from '../common/CardFallback.js';
import { StopSelector } from './StopSelector.jsx';
import { TimetableHeader, TimetableFilterRow } from './TimetableHeader.jsx';
import { SubwayRedirectOverlay } from './SubwayRedirectOverlay.jsx';
import { ScrollToTopPill } from '../playlist/shared/ScrollToTopPill.jsx';
import { openKakaoSubway } from './kakaoSubway.js';
import { findUpcomingSchedule, formatUpcomingScheduleMessage, type PeriodScheduleItem } from './upcomingSchedule.js';
import { getKSTToday } from '../../../utils/kstTime.js';
import { findScrollableAncestor } from '../../../utils/scroll.js';

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
  emptyState: ShuttleEmptyState;
  nextIdx: number;
  now: number;
  subwayArrivals: SubwayScheduleRow[];
  isWeekend: boolean;
  needsSubway: boolean;
  loadErr: string | null;
  onRetry: () => void;
  isLoading: boolean;
  isSubwayLoading: boolean;
  isSubwayError: boolean;
  onSubwayRetry: () => void;
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
  schedule, emptyState, nextIdx, now,
  subwayArrivals,
  isWeekend,
  needsSubway,
  loadErr, onRetry, isLoading, isSubwayLoading, isSubwayError, onSubwayRetry, isGpsLoading,
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

  // needsSubway(지하철 연동 필요 정류장)의 여집합 — SUBWAY_CONNECTED_STOPS(Shuttle.ts)에서 파생
  const hideSubwayCol = !needsSubway;

  // 선택된 노선/방향의 시간표 데이터 자체가 없는 예외 상황(시간표 개정 미반영 등) — 조회는 성공했는데 이 경우만 발생
  const isScheduleMissing = isSubwayScheduleMissing(subwayArrivals, lineId);
  const selectedLineLabel = SUBWAY_OPTS.find(o => o.id === lineId)?.line ?? '지하철';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const stopSelectorRef = useRef<HTMLDivElement>(null);

  // 전체 시간표를 켜는 순간엔 맨 위(첫차)로 즉시 이동 — 이후 TimetableRow가 현재 시간대 행으로 자체 스크롤 애니메이션을 돌림
  useEffect(() => {
    if (!isFullMode) return;
    findScrollableAncestor(containerRef.current)?.scrollTo({ top: 0 });
  }, [isFullMode]);

  // 전체 시간표에서 출발지·학기·요일을 바꿔도 "보고 있던 시간대"를 그대로 보여주기 위한 기준점.
  // 바꾸기 직전, 고정 헤더 바로 아래 걸친 행의 출발 시각과 헤더로부터의 거리를 기억해 둠
  // (지하철 노선은 시간표 행이 그대로라 기준점 없이 위치만 유지됨)
  const scrollAnchorRef = useRef<{ depMin: number; offset: number } | null>(null);
  const captureScrollAnchor = () => {
    const card = containerRef.current;
    const header = stopSelectorRef.current;
    if (!isFullMode || !card || !header || scrollAnchorRef.current) return;
    const headerBottom = header.getBoundingClientRect().bottom;
    const rows = Array.from(card.children) as HTMLElement[];
    // 시간표 카드 윗부분이 아직 보이는 상태(목록 위쪽)면 기준점 없이 지금 위치 유지
    if (!rows[0] || rows[0].getBoundingClientRect().top >= headerBottom) return;
    const idx = rows.findIndex(r => r.getBoundingClientRect().bottom > headerBottom);
    if (idx === -1 || !schedule[idx]) return;
    scrollAnchorRef.current = { depMin: schedule[idx].depMin, offset: rows[idx].getBoundingClientRect().top - headerBottom };
  };
  // 값이 실제로 바뀔 때만 기준점을 잡고 setter 호출 (PeriodDayTypeSelector는 닫힐 때 같은 값으로도 setter를 부름)
  const withScrollAnchor = <T,>(current: T, set: (value: T) => void) => (value: T) => {
    if (value !== current) captureScrollAnchor();
    set(value);
  };

  // 새 시간표가 그려진 직후(페인트 전) 기억해 둔 시각 이후 첫 행을 같은 높이에 맞춤 — 화면이 튀지 않고 내용만 바뀐 것처럼 보임
  useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current;
    scrollAnchorRef.current = null;
    if (!anchor || !isFullMode) return;
    const card = containerRef.current;
    const header = stopSelectorRef.current;
    const scroller = findScrollableAncestor(card);
    if (!card || !header || !scroller) return;
    if (schedule.length === 0) {
      scroller.scrollTo({ top: 0 }); // 운행 정보가 없으면 맨 위의 안내 카드가 보이게
      return;
    }
    const found = schedule.findIndex(r => r.depMin >= anchor.depMin);
    const row = card.children[found === -1 ? schedule.length - 1 : found] as HTMLElement | undefined;
    if (!row) return;
    scroller.scrollTop += row.getBoundingClientRect().top - header.getBoundingClientRect().bottom - anchor.offset;
  }, [stop, fullDayType, fullPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  // 시간표 제목·필터 줄 — 전체 시간표 모드에선 행이 많아 출발지 고정 헤더 안에 함께 그려 스크롤해도 계속 보이게 하고,
  // 일반 모드에선 다음 셔틀 몇 행만 보여서 고정할 필요가 없으니 시간표 바로 위에 그림(고정 헤더가 화면을 덜 차지하게)
  const renderFilterRow = (className: string) => (
    <TimetableFilterRow
      className={className}
      isFullMode={isFullMode}
      fullPeriod={fullPeriod}
      setFullPeriod={withScrollAnchor(fullPeriod, setFullPeriod)}
      fullDayType={fullDayType}
      setFullDayType={withScrollAnchor(fullDayType, setFullDayType)}
      appConfig={appConfig}
      isWeekend={isWeekend}
      needsSubway={needsSubway}
      lineId={lineId}
      setLineId={setLineId}
    />
  );

  // 출발지 변경 — 전체 시간표에선 보던 시간대 유지, 일반 모드에선 새 출발지의 "다음 셔틀"이 바로 보이게 맨 위로.
  // 일반 모드 목록은 현재 시각 기준이라 계속 바뀌고 출발지 변경 시 더 불러오기도 초기화되므로, 출발지별 위치는 기억하지 않음
  const handleStopChange = (s: string) => {
    if (!isFullMode && s !== stop) {
      findScrollableAncestor(containerRef.current)?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    withScrollAnchor(stop, setStop)(s);
  };

  const handleToggleFullMode = () => {
    if (!isFullMode) setJustToggledFullMode(true);
    setIsFullMode(!isFullMode);
  };

  return (
    // 하단 여백: 이 pb(96) + 시간표 mb-6(24) + 스크롤 컨테이너 pb-6(24) = 144px
    // = 하단 내비게이션바 88px(bottom 24 + h-16) + 간격 12 + "맨 위로" 버튼 32 + 간격 12
    //   → 맨 끝까지 내려도 "맨 위로" 버튼이 마지막 요소(더 불러오기 등)와 겹치지 않고 그 아래 빈칸에 들어감
    <div className="pb-24 [animation:slideUp_0.4s_ease-out]">
      {/* 출발지 */}
      <StopSelector
        ref={stopSelectorRef}
        viewMode={viewMode}
        setViewMode={setViewMode}
        stop={stop}
        setStop={handleStopChange}
        isActive={isActive}
        isGpsLoading={isGpsLoading}
      >
        {isFullMode && renderFilterRow('mt-4')}
      </StopSelector>

      {/* 다가오는 시간표 변경 안내 배너 — 한번 뜨면 대상 기간이 될 때까지 계속 유지 */}
      <NoticeBanner shouldShow={isActive && !!upcomingSchedule} message={upcomingScheduleMessage ?? ''} persistOnceShown />

      {/* 시간표 */}
      <div className="mb-6">
        {!isFullMode && renderFilterRow('mb-3')}
        <TimetableHeader
          isFullMode={isFullMode}
          needsSubway={needsSubway}
          hideSubwayCol={hideSubwayCol}
          onOpenSubway={() => openKakaoSubway(lineId, () => setSubwayRedirecting(true))}
          onToggleFullMode={handleToggleFullMode}
        />

        {/* 선택된 노선/방향의 시간표 데이터가 통째로 비어있는 예외 상황 안내(시간표 개정 미반영 등) — 조회 자체는 성공했을 때만 뜸 */}
        <NoticeBanner
          shouldShow={needsSubway && !hideSubwayCol && !isSubwayLoading && !isSubwayError && isScheduleMissing}
          message={`${selectedLineLabel} 시간표 정보를 아직 준비 중이에요! 당분간 카카오 지하철을 이용해주세요`}
          delayMs={0}
        />

        {/* 지하철 연결편 조회 실패 안내 — 행마다 반복 표시하면 스팸이라 여기 한 번만. 다른 공지 배너와 동일한 UI + 재시도 버튼만 추가 */}
        <NoticeBanner
          shouldShow={needsSubway && !hideSubwayCol && isSubwayError}
          message="지하철 연결 정보를 불러오지 못했습니다"
          delayMs={0}
          variant="error"
          actionLabel="다시 시도"
          onAction={onSubwayRetry}
        />

        <div ref={containerRef} className="bg-white border border-slate-200 rounded-card overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
          {loadErr ? (
            // 2. 조회 실패 — 백엔드 요청이 실패한 경우
            <CardFallback message={loadErr} onRetry={onRetry} className="min-h-[425px]" />
          ) : isLoading ? (
            // 1. 첫 로딩 — 헤더는 이미 떠있고, 목록 자리만 실제 행과 같은 모양으로 채워둠
            Array.from({ length: 5 }).map((_, i) => <TimetableRowSkeleton key={i} hideSubwayCol={hideSubwayCol} />)
          ) : schedule.length > 0 ? (() => {
            // 4. 정상 — 조건(정류장/기간/요일)에 맞는 셔틀이 있음
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
                isSubwayLoading={isSubwayLoading}
                isSubwayError={isSubwayError}
                hideSubwayCol={hideSubwayCol}
                now={now}
                isFullMode={isFullMode}
                isActiveInFull={isFullMode && i === fullActiveIdx}
                shouldScroll={justToggledFullMode}
                autoFlip={triggerAutoFlip}
              />
            ));
          })() : (
            // 3. 조회는 됐지만 빈 데이터 — 실패는 아님. 전체 모드는 사용자가 고른 필터 결과라 기존 문구 유지,
            // 일반 모드는 미운행일(사유 포함)과 운행일인데 시간표 행이 없는 경우를 구분해 안내.
            // 실패 카드(2번)와 같은 CardFallback을 쓰되 아이콘·보조 문구를 바꿔 "정상인데 비어있음"임을 드러낸다
            <CardFallback
              icon={<Bus size={26} className="text-text-hint mb-1" />}
              message={
                isFullMode ? '운행 정보가 없습니다'
                  : emptyState.kind === 'NOT_OPERATING' ? '오늘은 셔틀이 운행하지 않아요'
                    : '오늘은 셔틀 운행 정보가 없어요'
              }
              subtext={!isFullMode && emptyState.kind === 'NOT_OPERATING' && emptyState.reason ? `미운행 사유 · ${emptyState.reason}` : ''}
              className="min-h-[425px]"
            />
          )}
        </div>

        {!isFullMode && schedule.length > visibleCount && (
          <div className="flex justify-center pt-3">
            <button
              className="bg-transparent border border-slate-300 text-text-sub rounded-full px-6 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2 hover:bg-surface"
              onClick={loadMore}
            >
              <ChevronDown size={16} />
              더 불러오기
            </button>
          </div>
        )}
      </div>

      <SubwayRedirectOverlay visible={subwayRedirecting} />

      {/* 전체 시간표처럼 목록이 길어졌을 때 "맨 위로" — 하단 내비게이션바(bottom 24px + h-16) 위로 띄움 */}
      <ScrollToTopPill size="compact" bottom="calc(100px + env(safe-area-inset-bottom))" />
    </div>
  );
}
