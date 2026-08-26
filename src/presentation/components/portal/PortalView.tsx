import React, { useState, lazy, Suspense } from 'react';

import { Bell } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather.js';
import { useWeatherBriefing } from '../../hooks/useWeatherBriefing.js';
import { useLibraryStatus } from '../../hooks/useLibraryStatus.js';
import { useBanners } from '../../hooks/useBanners.js';
import { WeatherCard } from './WeatherCard.jsx';
import { BannerCarousel } from './BannerCarousel.jsx';
import { LibraryStatusCard } from './LibraryStatusCard.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';
import { CardFallback } from '../common/CardFallback.jsx';

const WeatherAlarmSettings = lazy(() => import('./WeatherAlarmSettings.jsx').then(m => ({ default: m.WeatherAlarmSettings })));

interface PortalViewProps {
  isActive?: boolean;
}

export function PortalView({ isActive = true }: PortalViewProps) {
  const { weather, loading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeather(isActive);
  const { briefing } = useWeatherBriefing(isActive);
  const { library, loading: libraryLoading, error: libraryError, refetch: refetchLibrary } = useLibraryStatus(isActive);
  const { banners, loading: bannersLoading, error: bannersError } = useBanners();
  const [showWeatherAlarm, setShowWeatherAlarm] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');

  return (
    <>
      {/* 0. 날씨 알림 받기 플로팅버튼 */}
      <button
        className="fixed bottom-[calc(20px+64px+12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
        onClick={() => setShowWeatherAlarm(true)}>
        <Bell size={18} />
        날씨 알림 받기
      </button>

      {/* 0. 날씨 알림 받기 바텀시트 */}
      {showWeatherAlarm && (
        <Suspense fallback={null}>
          <WeatherAlarmSettings onClose={(msg?: string) => {
            setShowWeatherAlarm(false);
            if (msg) {
              setAlarmPopup(msg);
              setTimeout(() => setAlarmPopup(''), 1500);
            }
          }} />
        </Suspense>
      )}
      
      {/* 0. 날씨 알림 설정 후 하단 토스트팝업 */}
      {alarmPopup && (
        <div className="fixed bottom-[calc(20px+64px+60px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[1000] whitespace-pre-line text-center copy-toast">
          {alarmPopup}
        </div>
      )}
    
      <div className="pb-32 relative space-y-3 [animation:slideUp_0.4s_ease-out]">
        {/* 1. 에리카 날씨 섹션 */}
        <ErrorBoundary name="portal-weather" fallback={<CardFallback message="날씨 정보를 표시할 수 없습니다" />}>
          <WeatherCard weather={weather} loading={weatherLoading} isVisible={isActive} briefing={briefing} error={weatherError} onRetry={refetchWeather} />
        </ErrorBoundary>

        {/* 2. 배너 섹션 — 없어도 그만인 영역이라 조용히 숨긴다 */}
        <ErrorBoundary name="portal-banner">
          <BannerCarousel banners={banners} loading={bannersLoading} error={bannersError} />
        </ErrorBoundary>

        {/* 3. 열람실 혼잡도 섹션 */}
        <ErrorBoundary name="portal-library" fallback={<CardFallback message="혼잡도 정보를 표시할 수 없습니다" />}>
          <LibraryStatusCard library={library} loading={libraryLoading} error={libraryError} onRetry={refetchLibrary} />
        </ErrorBoundary>
      </div>
    </>
  );
}
