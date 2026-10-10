// 앱 루트 컴포넌트: 탭 라우팅 및 인증 상태 관리만 담당
import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, Suspense, lazy } from 'react';
import './index.css';
import { useMenu } from './presentation/hooks/useMenu.js';
import { CafeteriaView } from './presentation/components/cafeteria/CafeteriaView.jsx';
import { ShuttleView }   from './presentation/components/shuttle/ShuttleView.jsx';
import { PortalView }    from './presentation/components/portal/PortalView.jsx';
import { MiscView }      from './presentation/components/misc/MiscView.jsx';
import { VALID_MISC_BOXES, VALID_MAP_CHIPS } from './presentation/components/portal/BannerCarousel.jsx';
const CampusMapView = lazy(() => import('./presentation/components/campusMap/CampusMapView.jsx'));
const UXWritingOverlay = import.meta.env.DEV
  ? lazy(() => import('./devtools/ux-writing/UXWritingOverlay'))
  : null;
import { BottomNav }     from './presentation/components/common/BottomNav.jsx';
import { SplashScreen }  from './presentation/components/common/SplashScreen.jsx';
import { BootProvider, useBoot } from './presentation/context/BootContext';
import { NetworkProvider, useNetwork } from './presentation/context/NetworkContext';
import { OfflineModal } from './presentation/components/common/OfflineModal';
import { prefetchLocation }      from './presentation/hooks/useLocation.js';
import { prefetchBanners }       from './presentation/hooks/useBanners.js';
import { prefetchKakaoMapSdk }   from './lib/kakaoMap';
import { usePostHog } from 'posthog-js/react';
import { isNativeApp, getPlatform } from './lib/platform.js';
import { PushNotifications } from '@capacitor/push-notifications';
import { initSentry } from './lib/sentry.js';
import './lib/androidBackHandler.js';

declare global {
  interface Window {
    __NativeDeepLink?: {
      getParams?: () => string | null | undefined;
    };
    __pendingDeepLinkParams?: string | null;
    __reactReady?: boolean;
  }
}

interface CafeDeepLink {
  date: string | null;
  cafe: string | null;
  type: string | null;
}

// 콜드 스타트(앱이 꺼진 상태에서 tab=... 딥링크 URL로 새로 열리는 경우)에 tab/chip/box/trackId를 읽기 위한 헬퍼.
// 학식 딥링크(date/cafe/type)와 동일하게 웹은 현재 페이지 쿼리스트링을, 네이티브는 OS가 넘겨준 초기
// 딥링크 파라미터를 본다 — 이 둘 중 하나로 카카오 공유·배너 링크를 웹/앱 모두에서 cold start로 열 수 있게 함
function resolveInitialDeepLinkParams(): URLSearchParams {
  const webParams = new URLSearchParams(window.location.search);
  if (webParams.has('tab')) return webParams;
  try {
    const native = window.__NativeDeepLink?.getParams?.();
    if (native) return new URLSearchParams(native);
  } catch {}
  return webParams;
}

// 카카오 공유(date/cafe/type)·푸시 알림(tab=weather/partner) 딥링크가 가리키는 초기 탭을 계산.
// 웹(PWA)은 알림 클릭 시 routeFromParams를 안 거치고 곧바로 이 URL로 새로 열리므로, 초기 탭
// 계산 단계에서부터 tab 파라미터까지 봐야 소식탭 알림이 마지막 탭이 아니라 소식탭으로 열린다.
function resolveInitialTab(search: string): string | null {
  const p = new URLSearchParams(search);
  const tab = p.get('tab');
  if (tab === 'weather') return 'portal';
  if (tab === 'partner') return 'partner';
  if (tab === 'misc') return 'misc';
  if (tab === 'cafe' || p.has('date') || p.has('cafe') || p.has('type')) return 'cafe';
  return null;
}

export default function App() {
  return (
    <NetworkProvider>
      <BootProvider>
        <MainLayout />
        {UXWritingOverlay && (
          <Suspense fallback={null}>
            <UXWritingOverlay />
          </Suspense>
        )}
      </BootProvider>
    </NetworkProvider>
  );
}

function MainLayout() {
  // 0. 시작 상태 계산
  const isApp = isNativeApp();
  const platform = getPlatform(); // 'ios' | 'android' | 'web'
  const [activeTab, setActiveTab] = useState(() => {
    const fromUrl = resolveInitialTab(window.location.search);
    if (fromUrl) return fromUrl;
    try {
      const native = window.__NativeDeepLink?.getParams?.();
      if (native) { const fromNative = resolveInitialTab(`?${native}`); if (fromNative) return fromNative; }
    } catch {}
    const dlTab = resolveInitialDeepLinkParams().get('tab');
    if (dlTab === 'weather') return 'portal';
    if (dlTab === 'partner' || dlTab === 'misc') return dlTab;
    let lastTab = localStorage.getItem('lastActiveTab') || 'cafe';
    if (lastTab === 'qr') lastTab = 'cafe';
    return lastTab;
  });
  const [isCafeteriaLink] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has('date') || p.has('cafe') || p.has('type')) return true;
    try {
      const native = window.__NativeDeepLink?.getParams?.();
      if (native) { const np = new URLSearchParams(native); return np.has('date') || np.has('cafe') || np.has('type'); }
    } catch {}
    return false;
  });
  const [cafeDeepLink, setCafeDeepLink] = useState<CafeDeepLink | null>(null);
  const [showCafeDeepLinkLoader, setShowCafeDeepLinkLoader] = useState(() => {
    try {
      const native = window.__NativeDeepLink?.getParams?.();
      if (native) { const np = new URLSearchParams(native); return np.has('date') || np.has('cafe') || np.has('type'); }
    } catch {}
    return false;
  });
  // 제휴탭 최초 진입 후에만 지도 컴포넌트를 마운트 (SDK lazy load 트리거)
  const [partnerVisited, setPartnerVisited] = useState(() => activeTab === 'partner');
  const [miscResetSignal, setMiscResetSignal] = useState(0);
  // 에리카 플레이리스트 신규 홍보용 — 기타탭에 한 번이라도 진입하면 하단 네비 NEW 뱃지를 영구히 숨김
  const [showMiscNew, setShowMiscNew] = useState(() => { try { return localStorage.getItem('seenPlaylistFeature') !== '1'; } catch { return true; } });
  // 캠퍼스맵 탭을 다시 누르면 검색 화면 등을 닫고 지도로 돌아오게 하는 신호
  const [mapResetSignal, setMapResetSignal] = useState(0);
  // 배너 등에서 캠퍼스맵의 특정 칩(예: 오픈스페이스)까지 지정해 이동시킬 때 CampusMapView에 한 번만 전달.
  // 콜드 스타트로 tab=partner&chip=... 링크를 바로 열었을 때도(웹/네이티브 모두) 초기값으로 잡아줌
  const [pendingMapChip, setPendingMapChip] = useState<string | null>(() => {
    const dl = resolveInitialDeepLinkParams();
    if (dl.get('tab') !== 'partner') return null;
    const chip = dl.get('chip');
    return chip && VALID_MAP_CHIPS.includes(chip) ? chip : null;
  });
  
  // 배너 등에서 기타탭의 특정 서브뷰(예: 헬스장, 중앙동아리)까지 지정해 이동시킬 때 MiscView에 한 번만 전달.
  // 콜드 스타트로 tab=misc&box=... 링크를 바로 열었을 때도(웹/네이티브 모두) 초기값으로 잡아줌
  const [pendingMiscBox, setPendingMiscBox] = useState<string | null>(() => {
    const dl = resolveInitialDeepLinkParams();
    if (dl.get('tab') !== 'misc') return null;
    const box = dl.get('subView') || dl.get('box');
    return box && VALID_MISC_BOXES.includes(box) ? box : null;
  });
  // 카카오 공유 등에서 플레이리스트의 특정 곡 게시글 모음까지 지정해 이동시킬 때 PlaylistView에 한 번만 전달.
  // 콜드 스타트로 tab=misc&box=playlist&trackId=... 링크를 바로 열었을 때도(웹/네이티브 모두) 초기값으로 잡아줌
  const [pendingPlaylistTrackId, setPendingPlaylistTrackId] = useState<string | null>(() => {
    const dl = resolveInitialDeepLinkParams();
    if (dl.get('tab') !== 'misc' || dl.get('box') !== 'playlist') return null;
    return dl.get('trackId');
  });
  // 소식탭 플레이리스트 배너에서 아티스트를 눌렀을 때, 플레이리스트의 그 아티스트 검색 결과 화면으로 바로 보내기 위해 PlaylistView에 한 번만 전달
  const [pendingPlaylistSearchQuery, setPendingPlaylistSearchQuery] = useState<string | null>(null);
  // 소식탭 오늘의 동아리 추천에서 "보러가기"를 눌렀을 때, 중앙동아리 목록에서 그 동아리 위치로
  // 자동 스크롤하기 위해 ClubView에 한 번만 전달
  const [pendingClubId, setPendingClubId] = useState<string | null>(null);
  const { isAppReady, splashDone, completeSplash } = useBoot();
  const { isOnline } = useNetwork();
  const posthog = usePostHog();
  const tabStartTime = useRef(Date.now());

  // 1. 탭별 스크롤 위치 저장/복원 — 탭들이 스크롤 컨테이너 하나를 공유하므로
  // 전환 시 떠나는 탭의 scrollTop을 기록해두고 돌아올 때 되돌린다
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  // deps 없는 콜백(routeFromParams)에서도 호출되므로 activeTab을 ref로 읽는다
  const saveScrollPosition = useCallback(() => {
    scrollPositions.current[activeTabRef.current] = scrollContainerRef.current?.scrollTop ?? 0;
  }, []);
  // 페인트 전에 복원해 이전 탭 위치가 한 프레임 보이는 깜빡임을 방지
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPositions.current[activeTab] ?? 0;
    }
  }, [activeTab]);

  // 2. 학식 데이터 - 학식탭이 활성 탭일 때만 요청(다른 탭 진입 시 불필요한 백엔드 호출 방지)
  const { menuDate, cafes, menuLoading, menuRevalidating, changeDate, refetchMenu } = useMenu(activeTab === 'cafe');
  useEffect(() => {
    prefetchLocation(); // 위치 권한이 이미 있는 사용자만 백그라운드 측위 (권한 팝업 없음)
  }, []);

  // 소식탭을 한 번도 안 들어간 사용자도 다음 부팅 스플래시 배너 캐시가 채워지도록,
  // 탭 방문 여부와 무관하게 앱 진입 시 1회 배너 API를 미리 불러둔다
  useEffect(() => {
    prefetchBanners();
  }, []);

  // 2-1. 캠퍼스맵 SDK 프리페치 - 스플래시 종료 직후(크리티컬 패스 이후) 카카오맵 스크립트를 미리 받아둔다.
  useEffect(() => {
    if (splashDone) prefetchKakaoMapSdk();
  }, [splashDone]);

  // 3. 딥링크 로더 - 학식 딥링크 로더가 활성화되면 메인 스플래시를 즉시 제거
  // 학식 로더가 화면을 덮고 있으므로 사용자에게는 보이지 않고, 로더 페이드아웃 시 하냥냥 마스코트가 잠깐 비치는 현상 방지
  useEffect(() => {
    if (showCafeDeepLinkLoader && !splashDone) {
      completeSplash();
    }
  }, [showCafeDeepLinkLoader, splashDone, completeSplash]);

  // 3. 탭 라우팅 공통 함수 - Kakao 딥링크 / 푸시 알림 양쪽에서 재사용
  const routeFromParams = useCallback((paramString: string) => {
    saveScrollPosition();
    const params = new URLSearchParams(paramString);
    const tab = params.get('tab');
    if (tab === 'weather') {
      setActiveTab('portal');
      localStorage.setItem('lastActiveTab', 'portal');
      return;
    }
    if (tab === 'partner') {
      setPartnerVisited(true);
      setActiveTab('partner');
      localStorage.setItem('lastActiveTab', 'partner');
      return;
    }
    if (tab === 'misc') {
      const box = params.get('subView') || params.get('box');
      const trackId = params.get('trackId');
      if (box && VALID_MISC_BOXES.includes(box)) setPendingMiscBox(box);
      if (trackId && box === 'playlist') setPendingPlaylistTrackId(trackId);
      setActiveTab('misc');
      localStorage.setItem('lastActiveTab', 'misc');
      return;
    }
    if (tab === 'cafe' || params.has('date') || params.has('cafe') || params.has('type')) {
      setActiveTab('cafe');
      localStorage.setItem('lastActiveTab', 'cafe');
      setCafeDeepLink({
        date: params.get('date'),
        cafe: params.get('cafe'),
        type: params.get('type'),
      });
      setShowCafeDeepLinkLoader(true);
    }
  }, [saveScrollPosition]);

  // 3. Android Kakao 딥링크 처리 (MainActivity.java가 evaluateJavascript로 주입)
  // window.__pendingDeepLinkParams: 초기 실행 시 React 마운트 전에 도착한 파라미터
  // hanyang-deeplink 이벤트: 앱이 이미 실행 중일 때 onNewIntent로 수신
  // window.__reactReady: Android injectOrDefer 폴링이 리스너 등록 완료를 확인하는 신호
  useEffect(() => {
    if (!isApp) return;
    window.__reactReady = true;
    const pending = window.__pendingDeepLinkParams;
    if (pending) {
      window.__pendingDeepLinkParams = null;
      routeFromParams(pending);
    }
    const handler = (e: Event) => routeFromParams((e as CustomEvent<string>).detail);
    document.addEventListener('hanyang-deeplink', handler);
    return () => document.removeEventListener('hanyang-deeplink', handler);
  }, [isApp, routeFromParams]);

  // 3. 네이티브 푸시 알림 탭 → 딥링크 처리
  useEffect(() => {
    if (!isApp) return;
    let handle: { remove: () => void } | undefined;
    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const link = event?.notification?.data?.link;
      if (!link) return;
      try {
        const url = new URL(link);
        routeFromParams(url.searchParams.toString());
      } catch (e) {
        console.error('Failed to parse notification deep link', e);
        initSentry().then(Sentry => {
          Sentry.captureException(e, { tags: { source: 'push-deeplink-parse' } });
        });
      }
    }).then(h => { handle = h; });
    return () => { handle?.remove(); };
  }, [isApp, routeFromParams]);

  // 4. 탭 클릭 핸들러 — chip은 배너 등에서 캠퍼스맵의 특정 칩(예: 오픈스페이스)까지, box는 기타탭의
  // 특정 서브뷰(예: 헬스장)까지 지정하고 싶을 때만 넘어온다.
  // 이미 그 탭에 있는 상태에서 다시 눌러도 값은 바뀌어야 하므로 재클릭 얼리 리턴보다 먼저 처리한다
  const handleTabChange = useCallback((tab: string, chip?: string, box?: string, clubId?: string, playlistSearchQuery?: string) => {
    if (chip && tab === 'partner') setPendingMapChip(chip);
    if (box && tab === 'misc') setPendingMiscBox(box);
    if (clubId && tab === 'misc' && box === 'clubs') setPendingClubId(clubId);
    if (playlistSearchQuery && tab === 'misc' && box === 'playlist') setPendingPlaylistSearchQuery(playlistSearchQuery);
    if (tab === 'misc' && showMiscNew) {
      setShowMiscNew(false);
      try { localStorage.setItem('seenPlaylistFeature', '1'); } catch { /* 저장 실패해도 이번 세션에선 숨겨짐 */ }
    }

    // 1. 같은 탭 재클릭 처리 — box로 특정 서브뷰를 지정한 딥링크라면 그리드로 리셋하지 않고 그 서브뷰로 바로 이동
    if (tab === activeTab) {
      if (tab === 'misc' && !box) setMiscResetSignal(s => s + 1);
      if (tab === 'partner') setMapResetSignal(s => s + 1);
      return;
    }

    // 2. Posthog 분석 계측
    const duration = Math.round((Date.now() - tabStartTime.current) / 1000);
    posthog?.capture('tab_time_spent', { tab: activeTab, duration_seconds: duration });
    posthog?.capture('tab_clicked', { tab, previous_tab: activeTab });
    tabStartTime.current = Date.now();

    if (tab === 'partner') setPartnerVisited(true);

    // 3. 스크롤 위치 저장 + 실제 전환
    saveScrollPosition();
    setActiveTab(tab);
    localStorage.setItem('lastActiveTab', tab);
  }, [activeTab, posthog, saveScrollPosition, showMiscNew]);

  return (
    <>
      {/* 스플래시 화면 */}
      {!splashDone && (
        <SplashScreen
          ready={isAppReady && isOnline}
          onDone={completeSplash}
          variant={isCafeteriaLink ? 'menu' : 'default'}
        />
      )}
      {/* 학식 딥링크 로더 */}
      {showCafeDeepLinkLoader && (
        <SplashScreen
          variant="menu"
          ready={!menuLoading && isOnline}
          onDone={() => setShowCafeDeepLinkLoader(false)}
        />
      )}
      {/* 오프라인 안내 모달: 스플래시 도중이든 이후든 오프라인이면 항상 노출, 스플래시가 뒤로 넘어가지 못하게 막음 */}
      <OfflineModal />

      {/* 메인 콘텐츠 화면 */}
      <div
        className="mx-auto w-full max-w-app h-[100dvh] flex flex-col overflow-hidden"
        style={{
          // 안드로이드 네이티브만 env 미지원 대비 28px 폴백. 그 외(iOS 앱·PWA·Safari)는 env 값 그대로 —
          // 노치/상태바가 없는 환경에선 0이라 일반 브라우저에 영향 없음
          paddingTop: isApp && platform === 'android' ? 'env(safe-area-inset-top, 28px)' : 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* key 제거: 탭 전환 시 컴포넌트 유지, display로 보이기/숨기기 */}
        <div ref={scrollContainerRef} data-scroll-container className={`flex-1 overflow-y-auto overflow-x-hidden px-4 ${(activeTab === 'cafe' || activeTab === 'shuttle') ? 'pb-6' : activeTab === 'partner' ? '' : activeTab === 'portal' ? 'pb-6' : 'py-6'}`}>
          <div style={{ display: activeTab === 'cafe' ? 'block' : 'none' }}>
            <CafeteriaView
              date={menuDate}
              changeDate={changeDate}
              cafes={cafes}
              loading={menuLoading}
              revalidating={menuRevalidating}
              onRetry={refetchMenu}
              cafeDeepLink={cafeDeepLink}
              onCafeDeepLinkHandled={() => setCafeDeepLink(null)}
            />
          </div>
          <div style={{ display: activeTab === 'shuttle' ? 'block' : 'none' }}>
            <ShuttleView isActive={activeTab === 'shuttle'} />
          </div>
          <div style={{ display: activeTab === 'portal' ? 'block' : 'none' }}>
            <PortalView isActive={activeTab === 'portal'} onNavigateToTab={handleTabChange} />
          </div>
          <div style={{ display: activeTab === 'misc' ? 'block' : 'none' }}>
            <MiscView
              resetSignal={miscResetSignal}
              isActive={activeTab === 'misc'}
              deepLinkBox={pendingMiscBox}
              onDeepLinkBoxHandled={() => setPendingMiscBox(null)}
              deepLinkTrackId={pendingPlaylistTrackId}
              onDeepLinkTrackIdHandled={() => setPendingPlaylistTrackId(null)}
              deepLinkSearchQuery={pendingPlaylistSearchQuery}
              onDeepLinkSearchQueryHandled={() => setPendingPlaylistSearchQuery(null)}
              deepLinkClubId={pendingClubId}
              onDeepLinkClubIdHandled={() => setPendingClubId(null)}
            />
          </div>
          {/* 지도는 px-4 패딩을 -mx-4로 상쇄해 전체 폭을 사용 */}
          <div className="-mx-4 h-full" style={{ display: activeTab === 'partner' ? 'block' : 'none' }}>
            {partnerVisited && (
              <Suspense fallback={<div className="h-full flex items-center justify-center"><span className="text-sm font-bold text-text-hint animate-pulse">지도 불러오는 중…</span></div>}>
                <CampusMapView
                  isActive={activeTab === 'partner'}
                  deepLinkChip={pendingMapChip}
                  onDeepLinkChipHandled={() => setPendingMapChip(null)}
                  resetSignal={mapResetSignal}
                />
              </Suspense>
            )}
          </div>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} showMiscNew={showMiscNew} />
      </div>
    </>
  );
}
