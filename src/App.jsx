// 앱 루트 컴포넌트: 탭 라우팅 및 인증 상태 관리만 담당
// Triggering redeploy
import React, { useState, useCallback, useRef } from 'react';
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
import { usePostHog } from 'posthog-js/react';
import { isNativeApp, getPlatform } from './lib/platform.js';

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
    return localStorage.getItem('lastActiveTab') || 'cafe';
  });
  const [slideDir, setSlideDir] = useState('right');
  const { isAppReady, splashDone, completeSplash } = useBoot();
  const posthog = usePostHog();
  const tabStartTime = useRef(Date.now());

  const { user, loading, login, relogin, logout, updateUser } = useAuth();
  const { menuDate, cafes, menuLoading, changeDate } = useMenu();

  const reloginFn = useCallback(() => relogin(), [relogin]);

  const handleNameDiscovered = useCallback((name) => {
    updateUser({ name });
  }, [updateUser]);

  const handleTabChange = useCallback((tab) => {
    if (tab === activeTab) return;

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
        />
      )}
      <div
        className="mx-auto w-full max-w-app h-[100dvh] flex flex-col overflow-hidden"
        style={isApp ? {
          paddingTop: platform === 'ios' ? 'env(safe-area-inset-top)' : 'env(safe-area-inset-top, 28px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        } : {}}
      >
        <div key={activeTab} className={`flex-1 overflow-y-auto overflow-x-hidden px-5 tab-slide-${slideDir} ${(activeTab === 'cafe' || activeTab === 'shuttle') ? 'pb-6' : 'py-6'}`}>
          {activeTab === 'qr' ? (
            user ? (
              <QRView
                user={user}
                reloginFn={reloginFn}
                onNameDiscovered={handleNameDiscovered}
                onLogout={logout}
              />
            ) : (
              <LoginForm onSuccess={login} />
            )
          ) : activeTab === 'cafe' ? (
            <CafeteriaView
              date={menuDate}
              changeDate={changeDate}
              cafes={cafes}
              loading={menuLoading}
            />
          ) : activeTab === 'shuttle' ? (
            <ShuttleView />
          ) : (
            activeTab === 'portal' ? (
              <PortalView />
            ) : (
              <MiscView />
            )
          )}
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    </>
  );
}
