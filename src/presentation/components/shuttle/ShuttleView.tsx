// 컴포넌트: 셔틀버스 시간표 및 일반버스 도착정보 화면 오케스트레이터
import { useState } from 'react';
import { useShuttle } from '../../hooks/useShuttle.js';
import { usePublicBus } from '../../hooks/usePublicBus.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { SchoolShuttleSection } from './SchoolShuttleSection.jsx';
import { PublicBusSection } from './PublicBusSection.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.js';
import { CardFallback } from '../common/CardFallback.js';

// 뒤로가기로 되돌릴 수 있는 셔틀탭 화면 상태 — 사용자가 출발지 칩이나 학교셔틀/일반버스를 바꾸기 직전의 모습
interface NavSnapshot {
  stop: string;
  viewMode: 'shuttle' | 'bus';
}

// 쌓아 두는 이력 상한 — 칩을 계속 눌러도 무한히 쌓이지 않게
const MAX_NAV_HISTORY = 30;

interface ShuttleViewProps {
  isActive: boolean;
}

export function ShuttleView({ isActive }: ShuttleViewProps) {
  const shuttle = useShuttle(isActive);
  const bus = usePublicBus(isActive);

  // 뒤로가기 이력: 출발지 칩·학교셔틀/일반버스를 바꿀 때마다 "바꾸기 전" 상태를 쌓고, 뒤로가기가 하나씩 꺼내 복원한다.
  // GPS 가까운 정류장 자동 선택은 사용자가 한 조작이 아니므로 쌓지 않는다 (useShuttle이 setStopState를 직접 호출).
  // 이력이 비어 있으면 핸들러를 등록하지 않아 전역 "한 번 더 누르면 종료" 흐름으로 넘어간다.
  const [navHistory, setNavHistory] = useState<NavSnapshot[]>([]);

  const pushNavSnapshot = () => {
    setNavHistory(prev => [...prev, { stop: shuttle.stop, viewMode: bus.viewMode }].slice(-MAX_NAV_HISTORY));
  };

  const handleStopChange = (next: string) => {
    if (next === shuttle.stop) return;
    pushNavSnapshot();
    shuttle.setStop(next);
  };

  const handleViewModeChange = (next: 'shuttle' | 'bus') => {
    if (next === bus.viewMode) return;
    pushNavSnapshot();
    bus.setViewMode(next);
  };

  // 탭이 숨겨져 있어도 컴포넌트는 마운트된 채라 isActive를 함께 본다 (CampusMapView와 동일한 이유)
  useBackHandler(() => {
    const previous = navHistory[navHistory.length - 1];
    if (!previous) return;
    setNavHistory(prev => prev.slice(0, -1));
    shuttle.setStop(previous.stop);
    bus.setViewMode(previous.viewMode);
  }, isActive && navHistory.length > 0);

  return (
    <div className="relative min-h-full">
      {bus.viewMode === 'shuttle' ? (
        <ErrorBoundary name="shuttle-schedule" fallback={<CardFallback message="셔틀 시간표를 표시할 수 없습니다" />}>
          <SchoolShuttleSection
            isActive={isActive}
            viewMode={bus.viewMode}
            setViewMode={handleViewModeChange}
            stop={shuttle.stop}
            setStop={handleStopChange}
            lineId={shuttle.lineId}
            setLineId={shuttle.setLineId}
            schedule={shuttle.schedule}
            emptyState={shuttle.emptyState}
            nextIdx={shuttle.nextIdx}
            now={shuttle.now}
            subwayArrivals={shuttle.subwayArrivals}
            isWeekend={shuttle.isWeekend}
            needsSubway={shuttle.needsSubway}
            loadErr={shuttle.loadErr}
            onRetry={shuttle.refetchSchedule}
            isLoading={shuttle.isLoading}
            isSubwayLoading={shuttle.isSubwayLoading}
            isSubwayError={shuttle.isSubwayError}
            onSubwayRetry={shuttle.refetchSubway}
            isGpsLoading={shuttle.isGpsLoading}
            visibleCount={shuttle.visibleCount}
            loadMore={shuttle.loadMore}
            isFullMode={shuttle.isFullMode}
            setIsFullMode={shuttle.setIsFullMode}
            fullDayType={shuttle.fullDayType}
            setFullDayType={shuttle.setFullDayType}
            fullPeriod={shuttle.fullPeriod}
            setFullPeriod={shuttle.setFullPeriod}
            appConfig={shuttle.appConfig}
          />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary name="shuttle-public-bus" fallback={<CardFallback message="버스 도착 정보를 표시할 수 없습니다" />}>
          <PublicBusSection
            viewMode={bus.viewMode}
            setViewMode={handleViewModeChange}
            isUserActive={bus.isUserActive}
            sortedStops={bus.sortedStops}
            activeStops={bus.activeStops}
            expandedStops={bus.expandedStops}
            setExpandedStops={bus.setExpandedStops}
            favorites={bus.favorites}
            setFavorites={bus.setFavorites}
            busArrivals={bus.busArrivals}
            isBusLoading={bus.isBusLoading}
            isBusError={bus.isBusError}
            userCoords={bus.userCoords}
            closestStopName={bus.closestStopName}
            isManualRefreshing={bus.isManualRefreshing}
            handleManualRefresh={bus.handleManualRefresh}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
