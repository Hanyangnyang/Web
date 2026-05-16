import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

import { supabase } from '../../lib/supabase.js';

const BootContext = createContext(null);

/**
 * 앱의 초기 로딩(부팅) 상태를 중앙 집중식으로 관리하는 프로바이더입니다.
 * 새로운 초기 로딩 데이터가 필요할 경우, 여기에 이름을 등록하고 해당 훅에서 markReady를 호출하면 됩니다.
 */
export function BootProvider({ children }) {
  // 초기화가 필요한 서비스 목록
  const [readyMap, setReadyMap] = useState({
    auth: false,
    menu: false,
    config: false,
  });

  const [appConfig, setAppConfig] = useState({
    current_period: '학기중',
    custom_holidays: [],
    force_weekend: false
  });

  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem('splashShown') === 'true';
  });

  const markReady = useCallback((key) => {
    setReadyMap(prev => {
      if (prev[key] === true) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  // Remote Config (app_config) 로딩 및 캐싱 로직
  React.useEffect(() => {
    async function fetchConfig() {
      const cached = localStorage.getItem('app_config_cache');
      if (cached) {
        try { setAppConfig(JSON.parse(cached)); } catch(e){}
      }

      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('*')
          .limit(1)
          .single();
        
        if (data && !error) {
          setAppConfig({
            current_period: data.current_period || '학기중',
            custom_holidays: data.custom_holidays || [],
            force_weekend: data.force_weekend || false
          });
          localStorage.setItem('app_config_cache', JSON.stringify(data));
        }
      } catch (e) {
        console.error('[Boot] Failed to fetch app config:', e);
      } finally {
        markReady('config');
      }
    }
    fetchConfig();
  }, [markReady]);

  // 모든 서비스가 준비되었는지 확인
  const isAppReady = useMemo(() => {
    return Object.values(readyMap).every(status => status === true);
  }, [readyMap]);

  const completeSplash = useCallback(() => {
    setSplashDone(true);
    sessionStorage.setItem('splashShown', 'true');
  }, []);

  const value = useMemo(() => ({
    isAppReady,
    splashDone,
    markReady,
    completeSplash,
    appConfig
  }), [isAppReady, splashDone, markReady, completeSplash, appConfig]);

  return (
    <BootContext.Provider value={value}>
      {children}
    </BootContext.Provider>
  );
}

export function useBoot() {
  const context = useContext(BootContext);
  if (!context) throw new Error('useBoot must be used within a BootProvider');
  return context;
}
