// 컴포넌트: "일반 버스" 화면 전체 (정류소 목록 + 절전 배너 + 새로고침)
import type { Dispatch, SetStateAction } from 'react';
import { RefreshCw } from 'lucide-react';
import type { TickingBusArrival } from '../../../domain/entities/PublicBus.js';
import { ViewModeToggle } from './ViewModeToggle.jsx';
import { BusStopCard } from './BusStopCard.jsx';

interface PublicBusSectionProps {
  viewMode: 'shuttle' | 'bus';
  setViewMode: (mode: 'shuttle' | 'bus') => void;
  isUserActive: boolean;
  sortedStops: string[];
  activeStops: string[];
  selectedStops: string[];
  expandedStops: Record<string, boolean>;
  setExpandedStops: Dispatch<SetStateAction<Record<string, boolean>>>;
  favorites: string[];
  setFavorites: Dispatch<SetStateAction<string[]>>;
  busArrivals: Record<string, TickingBusArrival[]>;
  isBusLoading: Record<string, boolean>;
  setIsBusLoading: Dispatch<SetStateAction<Record<string, boolean>>>;
  closestStopName: string | null;
  isManualRefreshing: boolean;
  handleManualRefresh: () => void;
}

export function PublicBusSection({
  viewMode, setViewMode,
  isUserActive,
  sortedStops,
  activeStops,
  selectedStops,
  expandedStops, setExpandedStops,
  favorites, setFavorites,
  busArrivals,
  isBusLoading, setIsBusLoading,
  closestStopName,
  isManualRefreshing,
  handleManualRefresh,
}: PublicBusSectionProps) {
  const handleToggleExpand = (stopName: string) => {
    const willExpand = !expandedStops[stopName];
    if (willExpand) {
      setIsBusLoading(prev => ({ ...prev, [stopName]: true }));
    }
    setExpandedStops(prev => ({ ...prev, [stopName]: willExpand }));
  };

  const handleToggleFavorite = (stopName: string) => {
    setFavorites(prev =>
      prev.includes(stopName)
        ? prev.filter(s => s !== stopName)
        : [...prev, stopName]
    );
  };

  return (
    <div className="pb-36 [animation:slideUp_0.4s_ease-out]">
      {/* 고정 상단 필터 영역 */}
      <div className="sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-xl z-[100] -mx-4 px-4 py-4 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold text-text-main">정류소</span>
          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>

      {/* 절전 모드 알림 배너 (grid-rows 트랜지션으로 부드럽게 접히고 펼쳐짐) */}
      <div className={`accordion-content ${!isUserActive ? 'expanded' : ''}`}>
        <div className="accordion-inner">
          <div className={`bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2.5 rounded-card text-center mb-3 transition-opacity duration-300 ${!isUserActive ? 'opacity-100' : 'opacity-0'}`}>
            데이터와 배터리 절약을 위해 실시간 업데이트를 일시 정지했습니다. 화면을 움직이거나 터치하면 재개합니다.
          </div>
        </div>
      </div>

      {/* 정류장별 버스 도착 정보 목록 */}
      <div className="space-y-3">
        {sortedStops
          .filter(stopName => {
            const passesBus = activeStops.includes(stopName);
            const matchesStopFilter = selectedStops.length === 0 || selectedStops.includes(stopName);
            return passesBus && matchesStopFilter;
          })
          .map(stopName => (
            <BusStopCard
              key={stopName}
              stopName={stopName}
              isExpanded={!!expandedStops[stopName]}
              isFav={favorites.includes(stopName)}
              isClosest={closestStopName === stopName}
              arrivals={busArrivals[stopName] || []}
              isLoading={!!isBusLoading[stopName]}
              hasLoadedOnce={busArrivals[stopName] !== undefined}
              onToggleExpand={handleToggleExpand}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
      </div>

      {/* 수동 새로고침 버튼 */}
      <button
        onClick={handleManualRefresh}
        disabled={isManualRefreshing}
        aria-label="버스 도착정보 새로고침"
        className="fixed bottom-[calc(24px+64px+24px+env(safe-area-inset-bottom))] right-[max(2.75rem,calc(50%-168px))] w-12 h-12 rounded-full bg-white border-[1.5px] border-primary/40 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center z-[999] cursor-pointer transition-transform duration-150 active:scale-90 disabled:cursor-not-allowed"
      >
        <RefreshCw size={20} className={`text-primary ${isManualRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
