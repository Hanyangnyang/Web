// 훅(ViewModel): 일반버스 즐겨찾기·도착정보 폴링 상태 관리
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueries } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import {
  DEFAULT_PRIORITY,
  STATION_IDS,
  getDistanceStrToStop,
  getClosestStopName,
  sortStopsByPriority,
  mergeArrivals,
  tickArrivals,
  type TickingBusArrival,
} from '../../domain/entities/PublicBus.js';
import { getBusArrivalsUseCase } from '../../di.js';
import { useLocation } from './useLocation.js';

const POLL_INTERVAL = 30 * 1000; // 30초
const IDLE_TIMEOUT = 3 * 60 * 1000; // 3분 미활동 시 절전 모드

export function usePublicBus(isActive = false) {
  const posthog = usePostHog();
  const [viewMode, setViewMode] = useState<'shuttle' | 'bus'>('shuttle');

  const { coords: userCoords } = useLocation(isActive && viewMode === 'bus'); // 사용자의 현재 위치 (위치 권한 허용 시)

  const [favorites, setFavorites] = useState<string[]>(() => { // 즐겨찾기
    try {
      const saved = localStorage.getItem('public_bus_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>({}); // 사용자가 펼친 정류소들
  const [busArrivals, setBusArrivals] = useState<Record<string, TickingBusArrival[]>>({}); // 정류소별 도착정보 (RQ가 받아온 원본을 mergeArrivals로 합친 결과)
  const [isPageVisible, setIsPageVisible] = useState(true); // 지금 이 탭이 화면에 보이는지
  const [isUserActive, setIsUserActive] = useState(true); // 사용자가 최근 3분간 마우스/키보드/스크롤 등으로 활동했는지
  const pausedByTabLeaveRef = useRef(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // 3분 미활동 사용자 감지 (절전 모드) + 탭 이탈 시 즉시 절전 모드 진입
  useEffect(() => {
    if (viewMode !== 'bus' || !isActive) {
      // 일반버스 화면을 보던 중 앱의 다른 탭으로 이동한 경우에만 절전 모드 진입
      // (학교셔틀 화면 전환은 viewMode 가드만으로 폴링이 멈추므로 절전 처리 불필요)
      if (viewMode === 'bus' && !isActive) {
        pausedByTabLeaveRef.current = true;
        setIsUserActive(false);
      }
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      setIsUserActive(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsUserActive(false);
      }, IDLE_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => {
      document.addEventListener(name, resetTimer);
    });

    if (pausedByTabLeaveRef.current) {
      // 탭을 벗어났다 돌아온 경우: 자동 재개하지 않고 사용자의 터치를 기다린다
      pausedByTabLeaveRef.current = false;
    } else {
      resetTimer();
    }

    return () => {
      clearTimeout(timeoutId);
      events.forEach(name => {
        document.removeEventListener(name, resetTimer);
      });
    };
  }, [viewMode, isActive]);

  // favorites localStorage에 저장
  useEffect(() => {
    localStorage.setItem('public_bus_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // userCoords가 바뀔 때마다 정류소 거리 계산
  const getDistanceStr = useCallback((stopName: string) => getDistanceStrToStop(userCoords, stopName), [userCoords]);
  const closestStopName = getClosestStopName(userCoords);
  const activeStops = DEFAULT_PRIORITY;
  const sortedStops = sortStopsByPriority(userCoords, favorites);

  const hasInitializedCoordsRef = useRef(false);
  const prevViewModeRef = useRef(viewMode);

  // expandedStops 초기화: 가장 가까운 2개 정류소를 자동으로 펼침
  useEffect(() => {
    if (viewMode === 'bus') {
      const viewModeChanged = prevViewModeRef.current !== viewMode;
      const coordsJustLoaded = !hasInitializedCoordsRef.current && userCoords;

      prevViewModeRef.current = viewMode;

      if (viewModeChanged || coordsJustLoaded) {
        if (coordsJustLoaded) {
          hasInitializedCoordsRef.current = true;
        }

        const top2 = sortedStops.slice(0, 2);
        const next: Record<string, boolean> = {};
        top2.forEach(s => { next[s] = true; });
        setExpandedStops(next);
      }
    } else {
      hasInitializedCoordsRef.current = false;
      prevViewModeRef.current = viewMode;
    }
  }, [viewMode, userCoords, sortedStops]);

  // 정류소별 도착정보 조회 + 30초 폴링
  const expandedStopNames = Object.keys(expandedStops).filter(k => expandedStops[k]);
  const shouldPoll = viewMode === 'bus' && isPageVisible && isUserActive;

  const busQueries = useQueries({
    queries: expandedStopNames.map(stopName => ({
      queryKey: ['bus-arrivals', stopName],
      queryFn: () => {
        posthog?.capture('bus_api_call', { stopName, stationId: STATION_IDS[stopName] });
        return getBusArrivalsUseCase.execute(stopName);
      },
      enabled: shouldPoll,
      refetchInterval: shouldPoll ? POLL_INTERVAL : false,
    })),
  });

  // 정류소별 로딩 상태 
  const isBusLoading: Record<string, boolean> = {};
  expandedStopNames.forEach((stopName, i) => {
    isBusLoading[stopName] = busQueries[i].isFetching;
  });

  // 새 데이터가 도착한 정류소만 이전 프레임과 병합해 카운트다운(seconds)을 이어감
  const dataFingerprint = busQueries.map(q => q.dataUpdatedAt).join(',');
  useEffect(() => {
    setBusArrivals(prev => {
      let changed = false;
      const next = { ...prev };
      expandedStopNames.forEach((stopName, i) => {
        const data = busQueries[i].data;
        if (data) {
          next[stopName] = mergeArrivals(data, prev[stopName] || []);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFingerprint]);

  // 수동 새로고침 버튼 클릭
  const handleManualRefresh = useCallback(() => {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);

    const minSpin = new Promise(resolve => setTimeout(resolve, 500)); // 최소 스핀 시간 확보 (즉시 끝나도 피드백 인지 가능하도록)

    Promise.all([
      Promise.all(busQueries.map(q => q.refetch())),
      minSpin,
    ]).finally(() => {
      setIsManualRefreshing(false);
    });
  }, [isManualRefreshing, busQueries]);

  // 탭/페이지 가시성 감지 (백그라운드 폴링 방지)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 1초 카운트다운
  useEffect(() => {
    if (viewMode !== 'bus' || !isPageVisible || !isUserActive) return;

    const timerId = setInterval(() => {
      setBusArrivals(prev => {
        const next: Record<string, TickingBusArrival[]> = {};
        let changed = false;

        Object.keys(prev).forEach(stopName => {
          const ticked = tickArrivals(prev[stopName] || []);
          if (ticked !== prev[stopName]) changed = true;
          next[stopName] = ticked;
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [viewMode, isPageVisible, isUserActive]);

  return {
    viewMode, setViewMode,
    userCoords,
    favorites, setFavorites,
    expandedStops, setExpandedStops,
    busArrivals,
    isBusLoading,
    isUserActive,
    isManualRefreshing,
    handleManualRefresh,
    sortedStops,
    activeStops,
    closestStopName,
    getDistanceStr,
  };
}
