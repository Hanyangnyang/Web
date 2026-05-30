import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

import { supabase } from '../../lib/supabase.js';
import { isCapacitorApp } from '../../lib/platform.js';

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
    force_weekend: false,
    period_schedule: [],
    no_operation_days: [],
    force_no_operation: false
  });

  const [splashDone, setSplashDone] = useState(() => {
    // 앱(Capacitor Android)에서는 네이티브 스플래시로 대체하므로 웹 스플래시 skip
    if (isCapacitorApp()) return true;
    return sessionStorage.getItem('splashShown') === 'true';
  });

  const markReady = useCallback((key) => {
    setReadyMap(prev => {
      if (prev[key] === true) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  // 오늘 날짜 기준 현재 기간 산출 함수
  const calculatePeriod = (schedule, override) => {
    if (override) return override;
    if (!schedule || schedule.length === 0) return '학기중';

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // 시작일 기준 내림차순 정렬 (최신순)
    const sorted = [...schedule].sort((a, b) => b.start.localeCompare(a.start));
    
    // 오늘 날짜보다 시작일이 이전이거나 같은 첫 번째 항목 찾기
    const found = sorted.find(item => item.start <= todayStr);
    return found ? found.name : '학기중';
  };

  // Remote Config (app_config) 로딩 및 캐싱 로직
  React.useEffect(() => {
    async function fetchConfig() {
      const cached = localStorage.getItem('app_config_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const period = calculatePeriod(parsed.period_schedule, parsed.current_period_override);
          setAppConfig({ ...parsed, current_period: period });
        } catch(e){}
      }

      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('*')
          .limit(1)
          .single();
        
        if (data && !error) {
          const period = calculatePeriod(data.period_schedule, data.current_period_override);
          const configData = {
            current_period: period,
            current_period_override: data.current_period_override,
            period_schedule: data.period_schedule || [],
            custom_holidays: data.custom_holidays || [],
            force_weekend: data.force_weekend || false,
            no_operation_days: data.no_operation_days || [],
            force_no_operation: data.force_no_operation || false
          };
          setAppConfig(configData);
          localStorage.setItem('app_config_cache', JSON.stringify(configData));
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
