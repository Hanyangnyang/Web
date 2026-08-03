// 앱 루트 컴포넌트: 탭 라우팅 및 인증 상태 관리만 담당
// Triggering redeploy
import React, { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import './index.css';
import { useMenu } from './presentation/hooks/useMenu.js';
import { CafeteriaView } from './presentation/components/cafeteria/CafeteriaView.jsx';
import { ShuttleView }   from './presentation/components/shuttle/ShuttleView.jsx';
import { PortalView }    from './presentation/components/portal/PortalView.jsx';
import { MiscView }      from './presentation/components/misc/MiscView.jsx';
import { PartnershipView } from './presentation/components/partnership/PartnershipView.jsx';
import { BottomNav }     from './presentation/components/common/BottomNav.jsx';
import { SplashScreen }  from './presentation/components/common/SplashScreen.jsx';
import { BootProvider, useBoot } from './presentation/context/BootContext';
import { NetworkProvider, useNetwork } from './presentation/context/NetworkContext';
import { OfflineModal } from './presentation/components/common/OfflineModal';
import { prefetchPortalData }    from './presentation/hooks/usePortalData.js';
import { prefetchBanners }       from './presentation/hooks/useBanners.js';
import { prefetchShuttleSchedule } from './presentation/hooks/useShuttle.js';
import { prefetchLocation }      from './presentation/hooks/useLocation.js';
import { usePostHog } from 'posthog-js/react';
import { isNativeApp, getPlatform } from './lib/platform.js';
import { PushNotifications } from '@capacitor/push-notifications';
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

export default function App() {
  return (
    <NetworkProvider>
      <BootProvider>
        <MainLayout />
      </BootProvider>
    </NetworkProvider>
  );
}

function MainLayout() {
  // 0. 시작 상태 계산
  const isApp = isNativeApp();
  const platform = getPlatform(); // 'ios' | 'android' | 'web'
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has('date') || p.has('cafe') || p.has('type')) return 'cafe';
    try {
      const native = window.__NativeDeepLink?.getParams?.();
      if (native) { const np = new URLSearchParams(native); if (np.has('date') || np.has('cafe') || np.has('type')) return 'cafe'; }
    } catch {}
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
  const [miscResetSignal, setMiscResetSignal] = useState(0);
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

  // 2. 데이터 프리패치 - 앱 시작 시 필요한 데이터를 백그라운드에서 미리 로드
  const { menuDate, cafes, menuLoading, menuRevalidating, changeDate } = useMenu();
  useEffect(() => {
    prefetchPortalData();
    prefetchBanners();
    prefetchShuttleSchedule();
    prefetchLocation(); // 위치 권한이 이미 있는 사용자만 백그라운드 측위 (권한 팝업 없음)
  }, []);

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
      }
    }).then(h => { handle = h; });
    return () => { handle?.remove(); };
  }, [isApp, routeFromParams]);

  // 4. 탭 클릭 핸들러
  const handleTabChange = useCallback((tab: string) => {
    // 1. 같은 탭 재클릭 처리
    if (tab === activeTab) {
      if (tab === 'misc') setMiscResetSignal(s => s + 1);
      return;
    }

    // 2. Posthog 분석 계측
    const duration = Math.round((Date.now() - tabStartTime.current) / 1000);
    posthog?.capture('tab_time_spent', { tab: activeTab, duration_seconds: duration });
    posthog?.capture('tab_clicked', { tab, previous_tab: activeTab });
    tabStartTime.current = Date.now();

    // 3. 스크롤 위치 저장 + 실제 전환
    saveScrollPosition();
    setActiveTab(tab);
    localStorage.setItem('lastActiveTab', tab);
  }, [activeTab, posthog, saveScrollPosition]);

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
        style={isApp ? {
          paddingTop: platform === 'ios' ? 'env(safe-area-inset-top)' : 'env(safe-area-inset-top, 28px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        } : {}}
      >
        {/* key 제거: 탭 전환 시 컴포넌트 유지, display로 보이기/숨기기 */}
        <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto overflow-x-hidden px-4 ${(activeTab === 'cafe' || activeTab === 'shuttle' || activeTab === 'partner') ? 'pb-6' : 'py-6'}`}>
          <div style={{ display: activeTab === 'cafe' ? 'block' : 'none' }}>
            <CafeteriaView
              date={menuDate}
              changeDate={changeDate}
              cafes={cafes}
              loading={menuLoading}
              revalidating={menuRevalidating}
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
          <div style={{ display: activeTab === 'partner' ? 'block' : 'none' }}>
            <PartnershipView isActive={activeTab === 'partner'} />
          </div>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    </>
  );
}
