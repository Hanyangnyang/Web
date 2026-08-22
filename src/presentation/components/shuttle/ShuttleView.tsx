// 컴포넌트: 셔틀버스 시간표 및 일반버스 도착정보 화면 오케스트레이터
import { useShuttle } from '../../hooks/useShuttle.js';
import { usePublicBus } from '../../hooks/usePublicBus.js';
import { SchoolShuttleSection } from './SchoolShuttleSection.jsx';
import { PublicBusSection } from './PublicBusSection.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.js';
import { CardFallback } from '../common/CardFallback.js';

interface ShuttleViewProps {
  isActive: boolean;
}

export function ShuttleView({ isActive }: ShuttleViewProps) {
  const shuttle = useShuttle(isActive);
  const bus = usePublicBus(isActive);

  return (
    <div className="relative min-h-full">
      {bus.viewMode === 'shuttle' ? (
        <ErrorBoundary name="shuttle-schedule" fallback={<CardFallback message="셔틀 시간표를 표시할 수 없습니다" />}>
          <SchoolShuttleSection
            isActive={isActive}
            viewMode={bus.viewMode}
            setViewMode={bus.setViewMode}
            stop={shuttle.stop}
            setStop={shuttle.setStop}
            lineId={shuttle.lineId}
            setLineId={shuttle.setLineId}
            schedule={shuttle.schedule}
            nextIdx={shuttle.nextIdx}
            now={shuttle.now}
            subwayArrivals={shuttle.subwayArrivals}
            subwayOffPeak={shuttle.subwayOffPeak}
            isWeekend={shuttle.isWeekend}
            needsSubway={shuttle.needsSubway}
            loadErr={shuttle.loadErr}
            isLoading={shuttle.isLoading}
            isSubwayLoading={shuttle.isSubwayLoading}
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
            setViewMode={bus.setViewMode}
            isUserActive={bus.isUserActive}
            sortedStops={bus.sortedStops}
            activeStops={bus.activeStops}
            selectedStops={bus.selectedStops}
            expandedStops={bus.expandedStops}
            setExpandedStops={bus.setExpandedStops}
            favorites={bus.favorites}
            setFavorites={bus.setFavorites}
            busArrivals={bus.busArrivals}
            isBusLoading={bus.isBusLoading}
            closestStopName={bus.closestStopName}
            isManualRefreshing={bus.isManualRefreshing}
            handleManualRefresh={bus.handleManualRefresh}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
