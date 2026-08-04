import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getInitialOnlineStatus, subscribeToNetworkStatus } from '../../infrastructure/network/NetworkStatus.js';

interface NetworkContextValue {
  isOnline: boolean;
}

// NetworkContext를 생성
const NetworkContext = createContext<NetworkContextValue | null>(null);

// NetworkProvider 컴포넌트
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);

  useEffect(() => {
    let active = true;

    getInitialOnlineStatus().then((online) => {
      if (active) setIsOnline(online);
    });

    const unsubscribe = subscribeToNetworkStatus((online) => {
      if (active) setIsOnline(online);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

// useNetwork 훅
export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) throw new Error('useNetwork must be used within a NetworkProvider');
  return context;
}
