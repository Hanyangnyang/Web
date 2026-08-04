import React, { useState, lazy, Suspense } from 'react';

import { Bell } from 'lucide-react';
import { usePortalData } from '../../hooks/usePortalData.js';
import { useBanners } from '../../hooks/useBanners.js';
import { WeatherCard } from './WeatherCard.jsx';
import { BannerCarousel } from './BannerCarousel.jsx';
import { LibraryStatusCard } from './LibraryStatusCard.jsx';

const WeatherAlarmSettings = lazy(() => import('./WeatherAlarmSettings.jsx').then(m => ({ default: m.WeatherAlarmSettings })));

interface PortalViewProps {
  isVisible?: boolean;
}

export function PortalView({ isVisible = true }: PortalViewProps) {
  const { weather, library, weatherLoading, libraryLoading } = usePortalData(isVisible);
  const { banners, loading: bannersLoading } = useBanners(isVisible);
  const [showWeatherAlarm, setShowWeatherAlarm] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');

  return (
    <>
      {/* 0. 날씨 알림 받기 플로팅버튼 */}
      <button
        className="fixed bottom-[calc(20px+64px+12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
        onClick={() => setShowWeatherAlarm(true)}
>
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

      <div className="pb-24 relative [animation:slideUp_0.4s_ease-out]">
        {/* 1. 에리카 날씨 섹션 */}
        <WeatherCard weather={weather} loading={weatherLoading} isVisible={isVisible} />

        {/* 2. 배너 섹션 */}
        <BannerCarousel banners={banners} loading={bannersLoading} />

        {/* 3. 열람실 혼잡도 섹션 */}
        <LibraryStatusCard library={library} loading={libraryLoading} />
      </div>
    </>
  );
}
