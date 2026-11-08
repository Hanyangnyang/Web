import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { usePostHog } from 'posthog-js/react';

import { Bell, ChevronRight } from 'lucide-react';
import { useWeather } from '../../hooks/useWeather.js';
import { useLibraryStatus } from '../../hooks/useLibraryStatus.js';
import { useBanners } from '../../hooks/useBanners.js';
import { useClubSpotlight, isClubBannerSeason } from '../../hooks/useClubSpotlight.js';
import { useArtistRecommendations } from '../../hooks/playlist/useArtistRecommendations.js';
import { isLibraryCrowded } from '../../../domain/entities/LibraryRoom.js';
import { WeatherCard } from './WeatherCard.jsx';
import { BannerCarousel } from './BannerCarousel.jsx';
import { LibraryStatusCard } from './LibraryStatusCard.jsx';
import { PeperoPromoModal } from './PeperoPromoModal.js';
import { ClubSpotlightCard } from '../misc/ClubSpotlightCard.js';
import { ArtistPromoCarousel } from '../playlist/shared/ArtistPromoCarousel.js';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';
import { CardFallback } from '../common/CardFallback.jsx';
import { ModalErrorFallback } from '../common/ModalErrorFallback.jsx';
import { preconnectSpotifyImages } from '../../../lib/preconnect.js';

const WeatherAlarmSettings = lazy(() => import('./WeatherAlarmSettings.jsx').then(m => ({ default: m.WeatherAlarmSettings })));

// 날씨 알림 기능 자체는 그대로 두고, 진입 버튼만 사용자에게 안 보이게 내림 — 다시 노출하려면 이 값만 true로
const SHOW_WEATHER_ALARM_BUTTON = false;

interface PortalViewProps {
  isActive?: boolean;
  // 배너가 캠퍼스맵 등 앱 내부 탭으로 이동하는 링크일 때 새 창을 열지 않고 바로 탭을 전환하기 위해 씀.
  // chip은 캠퍼스맵 탭 안에서 특정 칩(예: 오픈스페이스)까지, box는 기타탭 안에서 특정 서브뷰(예: 헬스장)까지,
  // clubId는 기타탭 중앙동아리 안에서 특정 동아리 위치까지 미리 켜고 싶을 때만 넘어온다
  // playlistSearchQuery는 box가 'playlist'일 때, 플레이리스트 검색 결과 화면을 그 검색어로 바로 열고 싶을 때만 넘어온다
  onNavigateToTab?: (tab: string, chip?: string, box?: string, clubId?: string, playlistSearchQuery?: string) => void;
  // 빼빼로데이 프로모션 팝업 열기 콜백 (App 전역 모달과 연동)
  onOpenPeperoModal?: () => void;
}

export function PortalView({ isActive = true, onNavigateToTab, onOpenPeperoModal }: PortalViewProps) {
  const posthog = usePostHog();
  const { weather, loading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeather(isActive);
  const { library, loading: libraryLoading, error: libraryError, refetch: refetchLibrary } = useLibraryStatus(isActive);
  const { banners, loading: bannersLoading, error: bannersError } = useBanners(isActive);
  const [isPeperoModalOpen, setIsPeperoModalOpen] = useState(false);

  const { data: recommendations, isLoading: recommendationsLoading } = useArtistRecommendations(isActive);
  // 아티스트 이미지 URL은 추천 API 응답이 와야 알 수 있으므로, 응답을 기다리는 동안 이미지 서버 연결을 병렬로 열어둔다
  useEffect(() => {
    if (isActive) preconnectSpotifyImages();
  }, [isActive]);
  // 데이터가 같은 동안 배열 참조를 유지해야 캐러셀이 매 렌더마다 첫 장으로 되돌아가지 않음
  const artistPromos = useMemo(
    () => (recommendations ?? []).map((r) => ({ artistName: r.artist.name, artistImageUrl: r.artist.imageUrl })),
    [recommendations],
  );
  const spotlightClub = useClubSpotlight();
  const showClubBanner = isClubBannerSeason();
  // 주요 열람실이 매우 혼잡하면 오픈스페이스로 안내한다 (기준은 isLibraryCrowded). 클릭률을 보려면 노출 수도 있어야 해서,
  // 소식탭이 보이는 동안 혼잡 상태가 된 순간에 한 번만 노출 이벤트를 남긴다 (폴링으로 매번 다시 찍히지 않게)
  const libraryCrowded = !libraryLoading && !!library && isLibraryCrowded(library.list);
  const hintShownLogged = useRef(false);
  useEffect(() => {
    if (!isActive || !libraryCrowded || hintShownLogged.current) return;
    hintShownLogged.current = true;
    posthog?.capture('library_openspace_hint_shown');
  }, [isActive, libraryCrowded, posthog]);
  const [showWeatherAlarm, setShowWeatherAlarm] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');

  return (
    <>
      {/* 0. 날씨 알림 받기 플로팅버튼 — 사용자에게 노출 안 하기로 해서 숨김 (기능 코드는 유지) */}
      {SHOW_WEATHER_ALARM_BUTTON && (
        <button
          className="fixed bottom-[calc(20px+64px+12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
          onClick={() => setShowWeatherAlarm(true)}>
          <Bell size={18} />
          날씨 알림 받기
        </button>
      )}

      {/* 0. 날씨 알림 받기 바텀시트 */}
      {showWeatherAlarm && (
        <Suspense fallback={null}>
          <ErrorBoundary name="weather-alarm-settings" fallback={<ModalErrorFallback message="알림 설정을 열 수 없어요" onClose={() => setShowWeatherAlarm(false)} />}>
            <WeatherAlarmSettings onClose={(msg?: string) => {
              setShowWeatherAlarm(false);
              if (msg) {
                setAlarmPopup(msg);
                setTimeout(() => setAlarmPopup(''), 1500);
              }
            }} />
          </ErrorBoundary>
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
          <WeatherCard weather={weather} loading={weatherLoading} error={weatherError} onRetry={refetchWeather} />
        </ErrorBoundary>

        {/* 플레이리스트 배너 위치를 빼빼로데이 프로모션 배너로 대체 — 터치 시 상세 팝업 오픈 */}
        <ErrorBoundary name="portal-pepero-promo">
          <button
            type="button"
            onClick={() => {
              posthog?.capture('pepero_banner_clicked');
              if (onOpenPeperoModal) {
                onOpenPeperoModal();
              } else {
                setIsPeperoModalOpen(true);
              }
            }}
            aria-label="빼빼로데이 꽃과 빼빼로 선물 세트 픽업 예약 안내"
            className="relative block w-full aspect-[2/1] overflow-hidden rounded-2xl bg-[#FFF0F3] shadow-sm active:scale-[0.99] transition-transform text-left cursor-pointer"
          >
            <img
              src="/assets/promo/pepero-playlist-banner.jpg"
              alt="빼빼로데이엔 꽃으로 마음을 전해요"
              className="w-full h-full object-cover"
            />
          </button>
        </ErrorBoundary>

        {/* 1.5. 오늘의 동아리 추천 배너 — 중앙동아리 화면 상단과 동일한 로테이션 카드, 눌렀을 때만 기타탭>중앙동아리로 내부 이동. 3월·9월(모집 시즌)에만 노출 */}
        {showClubBanner && (
          <ErrorBoundary name="portal-club-spotlight">
            <ClubSpotlightCard
              key={spotlightClub.id}
              club={spotlightClub}
              actionLabel="보러가기"
              actionIcon={<ChevronRight size={14} />}
              onAction={() => {
                posthog?.capture('club_spotlight_banner_clicked', { club_id: spotlightClub.id, club_name: spotlightClub.name });
                onNavigateToTab?.('misc', undefined, 'clubs', spotlightClub.id);
              }}
              fullCardClickable
            />
          </ErrorBoundary>
        )}

        {/* 2. 배너 섹션 — 기존 배너 그대로 유지 */}
        <ErrorBoundary name="portal-banner">
          <BannerCarousel
            banners={banners}
            loading={bannersLoading}
            error={bannersError}
            isActive={isActive}
            onNavigateToTab={onNavigateToTab}
            onOpenModal={(modalType) => {
              if (modalType === 'pepero') setIsPeperoModalOpen(true);
            }}
          />
        </ErrorBoundary>

        {/* 3. 열람실 혼잡도 섹션 */}
        <ErrorBoundary name="portal-library" fallback={<CardFallback message="혼잡도 정보를 표시할 수 없습니다" />}>
          <LibraryStatusCard
            library={library}
            loading={libraryLoading}
            error={libraryError}
            onRetry={refetchLibrary}
            showOpenSpaceHint={libraryCrowded}
            onFindOpenSpace={() => {
              posthog?.capture('library_openspace_hint_clicked');
              onNavigateToTab?.('partner', 'openspace');
            }}
          />
        </ErrorBoundary>
      </div>

      {/* 빼빼로데이 프로모션 상세 모달 (onOpenPeperoModal이 부모에서 전달되지 않았을 때의 fallback) */}
      {!onOpenPeperoModal && (
        <PeperoPromoModal
          isOpen={isPeperoModalOpen}
          onClose={() => setIsPeperoModalOpen(false)}
          reservationUrl="https://open.kakao.com/o/s3Rr6aWi"
        />
      )}
    </>
  );
}
