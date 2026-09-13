import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase.js';
import { prefetchAcademicStatus } from '../hooks/useAcademicStatus.js';

export interface AppConfig {
  // 다가오는 시간표 변경 안내 배너용 미래 일정 테이블 — academic/status는 "오늘" 스냅샷만 줘서
  // 여긴 아직 Supabase(app_config.period_schedule) 직접 조회를 유지한다
  period_schedule: { start: string; name: string }[];
}

interface BootContextValue {
  isAppReady: boolean;
  splashDone: boolean;
  markReady: (key: string) => void;
  completeSplash: () => void;
  appConfig: AppConfig;
}

const BootContext = createContext<BootContextValue | null>(null);

/**
 * 앱의 초기 로딩(부팅) 상태를 중앙 집중식으로 관리하는 프로바이더입니다.
 * 즉 부팅 상태 관리자입니다.
 * 새로운 초기 로딩 데이터가 필요할 경우, 여기에 이름을 등록하고 해당 훅에서 markReady를 호출하면 됩니다.
 */
export function BootProvider({ children }: { children: React.ReactNode }) {
  // 부팅 시 필요한 서비스들의 준비 상태를 관리하는 맵
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({
    config: false,
  });

  const [appConfig, setAppConfig] = useState<AppConfig>({
    period_schedule: [],
  });

  // 스플래시를 한번만 보여주기 위한 플래그
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem('splashShown') === 'true';
  });

  // 특정 서비스가 준비되었음을 표시하는 함수
  const markReady = useCallback((key: string) => {
    setReadyMap(prev => {
      if (prev[key] === true) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  // 오늘의 학사/셔틀 통합 운영 상태(academic/status) — 셔틀 시간표가 학기중/방학이나 평일/주말을
  // 잘못 판단하면 여러 화면에서 눈에 띄게 이상해지므로 스플래시를 막는 boot 필수 데이터로 등록한다.
  // 실패해도(오프라인 등) 반드시 markReady를 불러야 무한 스플래시를 피할 수 있다 — 실패 시 useShuttle이
  // localWeekdayFallback으로 안전하게 대체함. 에러는 apiError를 통해 queryClient의 전역 Sentry 훅이 이미 태깅한다.
  React.useEffect(() => {
    prefetchAcademicStatus().catch(() => {}).finally(() => markReady('config'));
  }, [markReady]);

  // 다가오는 시간표 변경 배너용 미래 일정 테이블 — 이 배너 하나만 안 뜨는 수준이라 스플래시를 막지 않는다
  React.useEffect(() => {
    async function fetchPeriodSchedule() {
      const cached = localStorage.getItem('period_schedule_cache');
      if (cached) {
        try {
          setAppConfig({ period_schedule: JSON.parse(cached) });
        } catch (e) {}
      }

      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('period_schedule')
          .limit(1)
          .single();

        if (data && !error) {
          const schedule = data.period_schedule || [];
          setAppConfig({ period_schedule: schedule });
          localStorage.setItem('period_schedule_cache', JSON.stringify(schedule));
        }
      } catch (e) {
        console.error('[Boot] Failed to fetch period schedule:', e);
      }
    }
    fetchPeriodSchedule();
  }, []);

  // 스플래시 내려도 되는지 판단하는 최종 기준 - 모든 서비스가 준비되었는지 확인
  const isAppReady = useMemo(() => {
    return Object.values(readyMap).every(status => status === true);
  }, [readyMap]);

  // 스플래시 끝났다는 표시
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

export function useBoot(): BootContextValue {
  const context = useContext(BootContext);
  if (!context) throw new Error('useBoot must be used within a BootProvider');
  return context;
}
