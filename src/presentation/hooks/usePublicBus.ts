// 훅(ViewModel): 일반버스 정류소 선택·즐겨찾기·도착정보 폴링 상태 관리
import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Geolocation & GPS — useLocation 모듈 캐시로 셔틀 탭과 좌표를 공유 (측위 경로 단일화)
  const { coords: userCoords } = useLocation(isActive && viewMode === 'bus');

  const [selectedStops, setSelectedStops] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('public_bus_selected_stops');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('public_bus_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [expandedStops, setExpandedStops] = useState<Record<string, boolean>>({});
  const [busArrivals, setBusArrivals] = useState<Record<string, TickingBusArrival[]>>({});
  const [isBusLoading, setIsBusLoading] = useState<Record<string, boolean>>({});
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isUserActive, setIsUserActive] = useState(true);
  const pausedByTabLeaveRef = useRef(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const expandedStopsRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    expandedStopsRef.current = expandedStops;
  }, [expandedStops]);

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

  useEffect(() => {
    localStorage.setItem('public_bus_selected_stops', JSON.stringify(selectedStops));
  }, [selectedStops]);

  useEffect(() => {
    localStorage.setItem('public_bus_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const getDistanceStr = useCallback((stopName: string) => getDistanceStrToStop(userCoords, stopName), [userCoords]);
  const closestStopName = getClosestStopName(userCoords);
  const activeStops = DEFAULT_PRIORITY;
  const sortedStops = sortStopsByPriority(userCoords, favorites);

  const hasInitializedCoordsRef = useRef(false);
  const prevViewModeRef = useRef(viewMode);
  const prevSelectedStopsRef = useRef(selectedStops);

  // expandedStops 초기화: 전체 조회 모드면 가장 가까운 2개, 필터 모드면 선택한 정류소 전부
  useEffect(() => {
    if (viewMode === 'bus') {
      const viewModeChanged = prevViewModeRef.current !== viewMode;
      const selectedStopsChanged = JSON.stringify(prevSelectedStopsRef.current) !== JSON.stringify(selectedStops);
      const coordsJustLoaded = !hasInitializedCoordsRef.current && userCoords;

      prevViewModeRef.current = viewMode;
      prevSelectedStopsRef.current = selectedStops;

      if (viewModeChanged || selectedStopsChanged || coordsJustLoaded) {
        if (coordsJustLoaded) {
          hasInitializedCoordsRef.current = true;
        }

        if (selectedStops.length === 0) {
          const top2 = sortedStops.slice(0, 2);
          const next: Record<string, boolean> = {};
          top2.forEach(s => { next[s] = true; });
          setExpandedStops(next);
        } else {
          const next: Record<string, boolean> = {};
          selectedStops.forEach(s => { next[s] = true; });
          setExpandedStops(next);
        }
      }
    } else {
      hasInitializedCoordsRef.current = false;
      prevViewModeRef.current = viewMode;
    }
  }, [viewMode, selectedStops, userCoords, sortedStops]);

  const fetchBusArrivalsForStop = useCallback(async (stopName: string) => {
    setIsBusLoading(prev => ({ ...prev, [stopName]: true }));
    const spinStartedAt = Date.now();
    posthog?.capture('bus_api_call', { stopName, stationId: STATION_IDS[stopName] });
    try {
      const newArrivals = await getBusArrivalsUseCase.execute(stopName);
      setBusArrivals(prev => ({
        ...prev,
        [stopName]: mergeArrivals(newArrivals, prev[stopName] || []),
      }));
    } catch (e) {
      console.error(`Failed to fetch arrivals for ${stopName}:`, e);
    } finally {
      // 응답이 너무 빨라도 스피너를 최소 800ms 유지해 새로고침이 일어났음을 인지할 수 있게 한다
      const remain = Math.max(0, 800 - (Date.now() - spinStartedAt));
      setTimeout(() => {
        setIsBusLoading(prev => ({ ...prev, [stopName]: false }));
      }, remain);
    }
  }, [posthog]);

  const handleManualRefresh = useCallback(() => {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);

    const expandedList = Object.keys(expandedStopsRef.current).filter(k => expandedStopsRef.current[k] === true);
    const minSpin = new Promise(resolve => setTimeout(resolve, 500)); // 최소 스핀 시간 확보 (즉시 끝나도 피드백 인지 가능하도록)

    Promise.all([
      Promise.all(expandedList.map(stopName => fetchBusArrivalsForStop(stopName))),
      minSpin,
    ]).finally(() => {
      setIsManualRefreshing(false);
    });
  }, [isManualRefreshing, fetchBusArrivalsForStop]);

  const prevExpandedStopsRef = useRef<Record<string, boolean>>({});
  // 정류소가 새로 펼쳐지는 순간 즉시 조회
  useEffect(() => {
    if (viewMode !== 'bus') {
      prevExpandedStopsRef.current = {};
      return;
    }

    const newlyExpandedStops = Object.keys(expandedStops).filter(
      stopName => expandedStops[stopName] === true && !prevExpandedStopsRef.current[stopName]
    );

    newlyExpandedStops.forEach(stopName => {
      fetchBusArrivalsForStop(stopName);
    });

    prevExpandedStopsRef.current = expandedStops;
  }, [viewMode, expandedStops, fetchBusArrivalsForStop]);

  // 탭/페이지 가시성 감지 (백그라운드 폴링 방지)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 30초 주기 갱신 — 화면이 보이고 사용자가 활동 중일 때만
  useEffect(() => {
    if (viewMode !== 'bus' || !isPageVisible || !isUserActive) return;

    const fetchAll = () => {
      const expandedList = Object.keys(expandedStopsRef.current).filter(k => expandedStopsRef.current[k] === true);
      expandedList.forEach(stopName => {
        fetchBusArrivalsForStop(stopName);
      });
    };

    fetchAll();
    const intervalId = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [viewMode, fetchBusArrivalsForStop, isPageVisible, isUserActive]);

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
    selectedStops, setSelectedStops,
    favorites, setFavorites,
    expandedStops, setExpandedStops,
    busArrivals,
    isBusLoading, setIsBusLoading,
    isUserActive,
    isManualRefreshing,
    handleManualRefresh,
    sortedStops,
    activeStops,
    closestStopName,
    getDistanceStr,
  };
}
