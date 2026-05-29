// 앱 루트 컴포넌트: 탭 라우팅 및 인증 상태 관리만 담당
// Triggering redeploy
import React, { useState, useCallback, useEffect, useRef } from 'react';
import './index.css';
import { useAuth } from './presentation/hooks/useAuth.js';
import { useMenu } from './presentation/hooks/useMenu.js';
import { LoginForm }     from './presentation/components/LoginForm.jsx';
import { QRView }        from './presentation/components/QRView.jsx';
import { CafeteriaView } from './presentation/components/CafeteriaView.jsx';
import { ShuttleView }   from './presentation/components/ShuttleView.jsx';
import { PortalView }    from './presentation/components/PortalView.jsx';
import { MiscView }      from './presentation/components/MiscView.jsx';
import { BottomNav }     from './presentation/components/BottomNav.jsx';
import { SplashScreen }  from './presentation/components/SplashScreen.jsx';
import { BootProvider, useBoot } from './presentation/context/BootContext';
import { prefetchPortalData }    from './presentation/hooks/usePortalData.js';
import { usePostHog } from 'posthog-js/react';
import { isNativeApp, getPlatform } from './lib/platform.js';
import { PushNotifications } from '@capacitor/push-notifications';
import { App as CapApp } from '@capacitor/app';

const TAB_ORDER = ['cafe', 'shuttle', 'qr', 'portal', 'misc'];

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

  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has('date') || p.has('cafe') || p.has('type')) return 'cafe';
    let lastTab = localStorage.getItem('lastActiveTab') || 'cafe';
    if (lastTab === 'qr') lastTab = 'cafe'; // 도서관 탭 임시 비활성화
    return lastTab;
  });
  const [isCafeteriaLink, setIsCafeteriaLink] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.has('date') || p.has('cafe') || p.has('type');
  });
  const [cafeDeepLink, setCafeDeepLink] = useState(null);
  const [slideDir, setSlideDir] = useState('right');
  const [miscResetSignal, setMiscResetSignal] = useState(0);
  const { isAppReady, splashDone, completeSplash } = useBoot();
  const posthog = usePostHog();
  const tabStartTime = useRef(Date.now());

  const { user, loading, login, relogin, logout, updateUser } = useAuth();
  const { menuDate, cafes, menuLoading, changeDate } = useMenu();

  // 앱 시작 시 소식 탭 데이터를 백그라운드에서 미리 로드
  useEffect(() => {
    prefetchPortalData();
  }, []);

  // 네이티브 푸시 알림 탭 → 딥링크 처리
  useEffect(() => {
    if (!isApp) return;
    let handle;
    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const link = event?.notification?.data?.link;
      if (!link) return;
      try {
        const url = new URL(link);
        const params = url.searchParams;
        const tab = params.get('tab');
        if (tab === 'weather') {
          // 날씨 알림 → 소식 탭
          setActiveTab('portal');
          localStorage.setItem('lastActiveTab', 'portal');
          return;
        }
        // 학식 알림 → 학식 탭 + 파라미터 전달
        if (tab === 'cafe' || params.has('date') || params.has('cafe') || params.has('type')) {
          setActiveTab('cafe');
          localStorage.setItem('lastActiveTab', 'cafe');
          setCafeDeepLink({
            date: params.get('date'),
            cafe: params.get('cafe'),
            type: params.get('type'),
          });
        }
      } catch (e) {
        console.error('Failed to parse notification deep link', e);
      }
    }).then(h => { handle = h; });
    return () => { handle?.remove(); };
  }, [isApp]); // eslint-disable-line react-hooks/exhaustive-deps

  // 카카오 딥링크 URL에서 학식 파라미터 파싱
  const parseCafeParams = (urlString) => {
    try {
      const search = urlString.includes('?') ? urlString.slice(urlString.indexOf('?')) : '';
      const p = new URLSearchParams(search);
      if (p.has('date') || p.has('cafe') || p.has('type')) {
        return { date: p.get('date'), cafe: p.get('cafe'), type: p.get('type') };
      }
    } catch {}
    return null;
  };

  // 카카오 딥링크로 앱 진입 시 학식 탭으로 이동
  useEffect(() => {
    if (!isApp) return;
    let handle;

    // 콜드 스타트: 앱이 닫힌 상태에서 딥링크로 실행된 경우
    CapApp.getLaunchUrl().then(({ url }) => {
      if (!url) return;
      const params = parseCafeParams(url);
      if (!params) return;
      setIsCafeteriaLink(true);
      setActiveTab('cafe');
      localStorage.setItem('lastActiveTab', 'cafe');
      setCafeDeepLink(params);
    }).catch(() => {});

    // 웜 스타트: 앱이 백그라운드에 있는 상태에서 딥링크로 포그라운드 진입
    CapApp.addListener('appUrlOpen', (data) => {
      const params = parseCafeParams(data.url);
      if (!params) return;
      setActiveTab('cafe');
      localStorage.setItem('lastActiveTab', 'cafe');
      setCafeDeepLink(params);
    }).then(h => { handle = h; });

    return () => { handle?.remove(); };
  }, [isApp]); // eslint-disable-line react-hooks/exhaustive-deps

  const reloginFn = useCallback(() => relogin(), [relogin]);

  const handleNameDiscovered = useCallback((name) => {
    updateUser({ name });
  }, [updateUser]);

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
      <div
        className="mx-auto w-full max-w-app h-[100dvh] flex flex-col overflow-hidden"
        style={isApp ? {
          paddingTop: platform === 'ios' ? 'env(safe-area-inset-top)' : 'env(safe-area-inset-top, 28px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        } : {}}
      >
        {/* key 제거: 탭 전환 시 컴포넌트 유지, display로 보이기/숨기기 */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden px-5 tab-slide-${slideDir} ${(activeTab === 'cafe' || activeTab === 'shuttle') ? 'pb-6' : 'py-6'}`}>
          <div style={{ display: activeTab === 'qr' ? 'block' : 'none' }}>
            {user ? (
              <QRView user={user} reloginFn={reloginFn} onNameDiscovered={handleNameDiscovered} onLogout={logout} />
            ) : (
              <LoginForm onSuccess={login} />
            )}
          </div>
          <div style={{ display: activeTab === 'cafe' ? 'block' : 'none' }}>
            <CafeteriaView
              date={menuDate}
              changeDate={changeDate}
              cafes={cafes}
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
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    </>
  );
}
