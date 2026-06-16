// 앱 루트 컴포넌트: 탭 라우팅 및 인증 상태 관리만 담당
// Triggering redeploy
import React, { useState, useCallback, useEffect, useRef } from 'react';
import './index.css';
import { useMenu } from './presentation/hooks/useMenu.js';
import { CafeteriaView } from './presentation/components/CafeteriaView.jsx';
import { ShuttleView }   from './presentation/components/ShuttleView.jsx';
import { PortalView }    from './presentation/components/PortalView.jsx';
import { MiscView }      from './presentation/components/MiscView.jsx';
import { PartnershipView } from './presentation/components/PartnershipView.jsx';
import { BottomNav }     from './presentation/components/BottomNav.jsx';
import { SplashScreen }  from './presentation/components/SplashScreen.jsx';
import { BootProvider, useBoot } from './presentation/context/BootContext';
import { prefetchPortalData }    from './presentation/hooks/usePortalData.js';
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
  const [miscResetSignal, setMiscResetSignal] = useState(0);
  const { isAppReady, splashDone, completeSplash } = useBoot();
  const posthog = usePostHog();
  const tabStartTime = useRef(Date.now());

  const { menuDate, cafes, cafesDate, menuLoading, changeDate } = useMenu();

  // 앱 시작 시 소식 탭 데이터를 백그라운드에서 미리 로드
  useEffect(() => {
    prefetchPortalData();
  }, []);

  // 세션 시작 이벤트 (최초 1회)
  useEffect(() => {
    posthog?.capture('app_session_start', { platform, entry_tab: activeTab });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 앱이 백그라운드로 가거나 탭을 닫을 때 마지막 탭 체류 시간 기록
  // tab_time_spent는 탭 전환 시에만 발생하므로 마지막 탭 체류가 누락됨 — 이를 보완
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const duration = Math.round((Date.now() - tabStartTime.current) / 1000);
        posthog?.capture('tab_time_spent', { tab: activeTab, duration_seconds: duration });
        tabStartTime.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab, posthog]);

  // 카페 딥링크 로더가 활성화되면 메인 스플래시를 즉시 제거
  // 카페 로더가 화면을 덮고 있으므로 사용자에게는 보이지 않고, 로더 페이드아웃 시 하냥냥 마스코트가 잠깐 비치는 현상 방지
  useEffect(() => {
    if (showCafeDeepLinkLoader && !splashDone) {
      completeSplash();
    }
  }, [showCafeDeepLinkLoader, splashDone, completeSplash]);

  // 탭 라우팅 공통 함수 - Kakao 딥링크 / 푸시 알림 양쪽에서 재사용
  const routeFromParams = useCallback((paramString) => {
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
  }, []);

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

    const newIdx = TAB_ORDER.indexOf(tab);
    const curIdx = TAB_ORDER.indexOf(activeTab);
    setSlideDir(newIdx >= curIdx ? 'right' : 'left');
    setActiveTab(tab);
    localStorage.setItem('lastActiveTab', tab);
  }, [activeTab, posthog]);

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
        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-5 tab-slide-${slideDir} ${(activeTab === 'cafe' || activeTab === 'shuttle' || activeTab === 'partner') ? 'pb-6' : 'py-6'}`}>
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
          <div style={{ display: activeTab === 'partner' ? 'block' : 'none' }}>
            <PartnershipView isActive={activeTab === 'partner'} />
          </div>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    </>
  );
}
