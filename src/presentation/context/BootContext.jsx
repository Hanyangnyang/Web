import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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
    completeSplash
  }), [isAppReady, splashDone, markReady, completeSplash]);

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
