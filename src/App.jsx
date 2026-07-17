// 앱 루트 컴포넌트: 탭 라우팅 및 인증 상태 관리만 담당
// Triggering redeploy
import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, Suspense, lazy } from 'react';
import './index.css';
import { useMenu } from './presentation/hooks/useMenu.js';
import { CafeteriaView } from './presentation/components/CafeteriaView.jsx';
import { ShuttleView }   from './presentation/components/ShuttleView.jsx';
import { PortalView }    from './presentation/components/PortalView.jsx';
import { MiscView }      from './presentation/components/MiscView.jsx';
// 지도 SDK가 무거워서 제휴탭 최초 진입 시에만 청크를 로드한다
const PartnershipMapView = lazy(() => import('./presentation/components/partnership/PartnershipMapView.tsx'));
import { BottomNav }     from './presentation/components/BottomNav.jsx';
import { SplashScreen }  from './presentation/components/SplashScreen.jsx';
import { BootProvider, useBoot } from './presentation/context/BootContext';
import { prefetchPortalData }    from './presentation/hooks/usePortalData.js';
import { prefetchBanners }       from './presentation/hooks/useBanners.js';
import { prefetchLocation }      from './presentation/hooks/useLocation.js';
import { usePostHog } from 'posthog-js/react';
import { isNativeApp, getPlatform } from './lib/platform.js';
import { PushNotifications } from '@capacitor/push-notifications';
import './lib/androidBackHandler.js';

const TAB_ORDER = ['cafe', 'shuttle', 'portal', 'partner', 'misc'];

export default function App() {
  return (
    <BootProvider>
      <MainLayout />
    </BootProvider>
  );
}

function MainLayout() {
  const isApp = isNativeApp();
  const platform = getPlatform(); // 'ios' | 'android' | 'web'

  // Android 콜드 스타트 딥링크: JavascriptInterface로 첫 렌더링 전에 동기 감지
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has('date') || p.has('cafe') || p.has('type')) return 'cafe';
    try {
      const native = window.__NativeDeepLink?.getParams?.();
      if (native) { const np = new URLSearchParams(native); if (np.has('date') || np.has('cafe') || np.has('type')) return 'cafe'; }
    } catch {}
    let lastTab = localStorage.getItem('lastActiveTab') || 'cafe';
    if (lastTab === 'qr') lastTab = 'cafe'; // 도서관 탭 임시 비활성화
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
  const [cafeDeepLink, setCafeDeepLink] = useState(null);
  const [showCafeDeepLinkLoader, setShowCafeDeepLinkLoader] = useState(() => {
    try {
      const native = window.__NativeDeepLink?.getParams?.();
      if (native) { const np = new URLSearchParams(native); return np.has('date') || np.has('cafe') || np.has('type'); }
    } catch {}
    return false;
  });
  const [slideDir, setSlideDir] = useState('right');
  // 제휴탭 최초 진입 후에만 지도 컴포넌트를 마운트 (SDK lazy load 트리거)
  const [partnerVisited, setPartnerVisited] = useState(() => activeTab === 'partner');
  const [miscResetSignal, setMiscResetSignal] = useState(0);
  const { isAppReady, splashDone, completeSplash } = useBoot();
  const posthog = usePostHog();
  const tabStartTime = useRef(Date.now());

  // 탭별 스크롤 위치 저장/복원 — 탭들이 스크롤 컨테이너 하나를 공유하므로
  // 전환 시 떠나는 탭의 scrollTop을 기록해두고 돌아올 때 되돌린다
  const scrollContainerRef = useRef(null);
  const scrollPositions = useRef({});
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

  const { menuDate, cafes, cafesDate, menuLoading, changeDate } = useMenu();

  // 앱 시작 시 소식 탭 데이터를 백그라운드에서 미리 로드
  useEffect(() => {
    prefetchPortalData();
    prefetchBanners();
    prefetchLocation(); // 위치 권한이 이미 있는 사용자만 백그라운드 측위 (권한 팝업 없음)
  }, []);

  // 카페 딥링크 로더가 활성화되면 메인 스플래시를 즉시 제거
  // 카페 로더가 화면을 덮고 있으므로 사용자에게는 보이지 않고, 로더 페이드아웃 시 하냥냥 마스코트가 잠깐 비치는 현상 방지
  useEffect(() => {
    if (showCafeDeepLinkLoader && !splashDone) {
      completeSplash();
    }
  }, [showCafeDeepLinkLoader, splashDone, completeSplash]);

  // 탭 라우팅 공통 함수 - Kakao 딥링크 / 푸시 알림 양쪽에서 재사용
  const routeFromParams = useCallback((paramString) => {
    saveScrollPosition();
    const params = new URLSearchParams(paramString);
    const tab = params.get('tab');
    if (tab === 'weather') {
      setActiveTab('portal');
      localStorage.setItem('lastActiveTab', 'portal');
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

  // Android Kakao 딥링크 처리 (MainActivity.java가 evaluateJavascript로 주입)
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
    const handler = (e) => routeFromParams(e.detail);
    document.addEventListener('hanyang-deeplink', handler);
    return () => document.removeEventListener('hanyang-deeplink', handler);
  }, [isApp, routeFromParams]);

  // 네이티브 푸시 알림 탭 → 딥링크 처리
  useEffect(() => {
    if (!isApp) return;
    let handle;
    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const link = event?.notification?.data?.link;
      if (!link) return;
      try {
        const url = new URL(link);
        routeFromParams(url.searchParams.toString());
      } catch (e) {
        console.error('Failed to parse notification deep link', e);
      }
    }).then(h => { handle = h; });
    return () => { handle?.remove(); };
  }, [isApp, routeFromParams]);

  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab) {
      if (tab === 'misc') setMiscResetSignal(s => s + 1);
      return;
    }

    const duration = Math.round((Date.now() - tabStartTime.current) / 1000);
    posthog?.capture('tab_time_spent', { tab: activeTab, duration_seconds: duration });
    posthog?.capture('tab_clicked', { tab, previous_tab: activeTab });
    tabStartTime.current = Date.now();

    if (tab === 'partner') setPartnerVisited(true);
    const newIdx = TAB_ORDER.indexOf(tab);
    const curIdx = TAB_ORDER.indexOf(activeTab);
    setSlideDir(newIdx >= curIdx ? 'right' : 'left');
    saveScrollPosition();
    setActiveTab(tab);
    localStorage.setItem('lastActiveTab', tab);
  }, [activeTab, posthog, saveScrollPosition]);

  return (
    <>
      {!splashDone && (
        <SplashScreen
          ready={isAppReady}
          onDone={completeSplash}
          variant={isCafeteriaLink ? 'menu' : 'default'}
        />
      )}
      {showCafeDeepLinkLoader && (
        <SplashScreen
          variant="menu"
          ready={!menuLoading}
          onDone={() => setShowCafeDeepLinkLoader(false)}
        />
      )}
      <div
        className="mx-auto w-full max-w-app h-[100dvh] flex flex-col overflow-hidden"
        style={isApp ? {
          paddingTop: platform === 'ios' ? 'env(safe-area-inset-top)' : 'env(safe-area-inset-top, 28px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        } : {}}
      >
        {/* key 제거: 탭 전환 시 컴포넌트 유지, display로 보이기/숨기기 */}
        <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto overflow-x-hidden px-4 tab-slide-${slideDir} ${(activeTab === 'cafe' || activeTab === 'shuttle') ? 'pb-6' : activeTab === 'partner' ? '' : 'py-6'}`}>
          <div style={{ display: activeTab === 'cafe' ? 'block' : 'none' }}>
            <CafeteriaView
              date={menuDate}
              changeDate={changeDate}
              cafes={cafes}
              cafesDate={cafesDate}
              loading={menuLoading}
              cafeDeepLink={cafeDeepLink}
              onCafeDeepLinkHandled={() => setCafeDeepLink(null)}
            />
          </div>
          <div style={{ display: activeTab === 'shuttle' ? 'block' : 'none' }}>
            <ShuttleView isActive={activeTab === 'shuttle'} />
          </div>
          <div style={{ display: activeTab === 'portal' ? 'block' : 'none' }}>
            <PortalView isVisible={activeTab === 'portal'} />
          </div>
          <div style={{ display: activeTab === 'misc' ? 'block' : 'none' }}>
            <MiscView resetSignal={miscResetSignal} />
          </div>
          {/* 지도는 px-4 패딩을 -mx-4로 상쇄해 전체 폭을 사용 */}
          <div className="-mx-4 h-full" style={{ display: activeTab === 'partner' ? 'block' : 'none' }}>
            {partnerVisited && (
              <Suspense fallback={<div className="h-full flex items-center justify-center"><span className="text-sm font-bold text-text-hint animate-pulse">지도 불러오는 중…</span></div>}>
                <PartnershipMapView />
              </Suspense>
            )}
          </div>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    </>
  );
}
