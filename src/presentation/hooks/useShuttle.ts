// 훅(ViewModel): 셔틀 시간표 로딩·정류장 선택·지하철 연동 상태 관리
import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { computeSchedule, computeFullSchedule, curMin, type ScheduleItem } from '../../domain/entities/Shuttle.js';
import { getDistanceKm } from '../../domain/utils/haversine.js';
import { getShuttleDataUseCase, getSubwayArrivalsUseCase } from '../../di.js';
import { useBoot } from '../context/BootContext.jsx';
import { useLocation } from './useLocation.js';
import { getKSTDateKey, getKSTParts } from '../../utils/kstTime.js';

const SCHEDULE_TTL = 24 * 60 * 60 * 1000; // 24시간 — 로컬 shuttle.json은 앱 재배포 전까지 안 바뀜
const SUBWAY_POLL_INTERVAL = 2 * 60 * 1000; // 2분

const SCHEDULE_QUERY_KEY = ['shuttle', 'schedule'];
const subwayQueryKey = (full: boolean, dayType: string | null) => ['shuttle', 'subway', full, dayType];

interface Coords {
  latitude: number;
  longitude: number;
}

// 셔틀이 정차하는 지점의 좌표 — 이름이 같아도 일반버스 정류소(ShuttleView의 STOP_COORDS)와는 실제 위치가 다르다
const STATION_COORDS: Record<string, { lat: number; lon: number }> = {
  '기숙사': { lat: 37.293338, lon: 126.836230 },
  '셔틀콕': { lat: 37.298737, lon: 126.837870 },
  '한대앞': { lat: 37.309650, lon: 126.852108 },
};

// 좌표 기준 가장 가까운 셔틀 정류장. 모든 정류장이 1km 이상이면(캠퍼스 밖) '한대앞' 고정
const pickClosestStop = ({ latitude, longitude }: Coords) => {
  let closestStop = '한대앞';
  let minDistance = Infinity;
  Object.entries(STATION_COORDS).forEach(([name, coord]) => {
    const dist = getDistanceKm(latitude, longitude, coord.lat, coord.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closestStop = name;
    }
  });
  return minDistance >= 1.0 ? '한대앞' : closestStop;
};

const todayStr = () => getKSTDateKey();

// ─── 공개 Prefetch 함수 (App.jsx 에서 앱 시작 시 호출) ─────────────
export function prefetchShuttleSchedule() {
  return queryClient.prefetchQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: () => getShuttleDataUseCase.execute(),
    staleTime: SCHEDULE_TTL,
  });
}

export function useShuttle(isActive = false) {
  const { appConfig } = useBoot();
  const [stop, setStopState] = useState(() => localStorage.getItem('shuttle_stop') || '한대앞');
  const [lineId, setLineIdState] = useState(() => localStorage.getItem('shuttle_lineId') || 'line4-bulam');
  const [now, setNow] = useState(curMin);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isFullMode, setIsFullMode] = useState(false);
  const [fullDayType, setFullDayType] = useState('평일');
  const [fullPeriod, setFullPeriod] = useState(appConfig.current_period);

  const { coords, isLocating: isGpsLoading } = useLocation(isActive);

  useEffect(() => {
    if (appConfig.current_period) {
      setTimeout(() => {
        setFullPeriod(appConfig.current_period);
      }, 0);
    }
  }, [appConfig.current_period]);

  // 좌표가 준비되면 가장 가까운 셔틀 정류장 자동 선택.
  // 프리페치된 좌표는 탭 진입 렌더에서 동기로 도착하므로, useLayoutEffect로 페인트 전에
  // 반영해 이전 정류장이 한 프레임도 보이지 않게 한다. 측위 실패 시에는 coords가 없어
  // localStorage의 이전 저장값이 그대로 유지된다.
  useLayoutEffect(() => {
    if (!coords) return;
    setStopState(pickClosestStop(coords));
  }, [coords]);

  const setStop = (s: string) => {
    setStopState(s);
    localStorage.setItem('shuttle_stop', s);
    setVisibleCount(5); // 정류장 변경 시 초기화
  };
  const setLineId = (l: string) => { setLineIdState(l); localStorage.setItem('shuttle_lineId', l); };

  // 셔틀 시간표 (정적 로컬 JSON — 앱 재배포 전까지 staleTime 내에서 재요청 없음)
  const scheduleQuery = useQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: () => getShuttleDataUseCase.execute(),
    staleTime: SCHEDULE_TTL,
  });
  const allData = scheduleQuery.data ?? null;
  const loadErr = scheduleQuery.isError ? '셔틀 시간표를 불러오지 못했습니다.' : null;

  // 10초마다 현재 시각 갱신 (시간 경과가 UI에 즉각 반영되도록 주기 단축)
  useEffect(() => {
    const id = setInterval(() => setNow(curMin()), 10_000);
    return () => clearInterval(id);
  }, []);

  // 지하철 도착 정보 (2분 주기, 기숙사·셔틀콕만 필요)
  const needsSubway = stop === '기숙사' || stop === '셔틀콕';

  // 일반 모드: 서버 휴일 상태를 항상 받아오고, needsSubway일 때만 2분 폴링
  const normalSubwayQuery = useQuery({
    queryKey: subwayQueryKey(false, null),
    queryFn: () => getSubwayArrivalsUseCase.execute(false, null),
    enabled: !isFullMode,
    refetchInterval: needsSubway ? SUBWAY_POLL_INTERVAL : false,
  });

  // 전체 시간표 모드: 사용자가 고른 dayType 기준 조회 (자동 폴링 없음)
  const fullSubwayQuery = useQuery({
    queryKey: subwayQueryKey(true, fullDayType),
    queryFn: () => getSubwayArrivalsUseCase.execute(true, fullDayType),
    enabled: isFullMode,
  });

  // 일반 모드에서만 서버 휴일 판정을 fullDayType에 동기화 (전체 모드 진입 시엔 사용자가 직접 고름)
  useEffect(() => {
    if (isFullMode || !normalSubwayQuery.data) return;
    const isHol = normalSubwayQuery.data.isHoliday
      || [0, 6].includes(getKSTParts().day)
      || (appConfig.custom_holidays || []).includes(todayStr())
      || !!appConfig.force_weekend;
    setFullDayType(isHol ? '주말' : '평일');
  }, [isFullMode, normalSubwayQuery.data, appConfig]);

  const activeSubwayQuery = isFullMode ? fullSubwayQuery : normalSubwayQuery;
  const subwayArrivals = activeSubwayQuery.data?.arrivals ?? [];
  const subwayOffPeak = activeSubwayQuery.data?.offPeak ?? false;
  const isHolidayServer = normalSubwayQuery.data?.isHoliday ?? null;
  const isSubwayLoading = activeSubwayQuery.isFetching;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 5);
  }, []);

  const lookback = 15;
  let schedule: ScheduleItem[] = [];
  let nextIdx = -1;

  if (allData) {
    if (isFullMode) {
      schedule = computeFullSchedule(allData, stop, fullDayType, appConfig, fullPeriod);
      nextIdx = -1; // 전체 모드에서는 다음 셔틀 하이라이트 안 함
    } else {
      schedule = computeSchedule(allData, stop, now, isHolidayServer, lookback, appConfig);
      nextIdx = schedule.findIndex(r => r.depMin >= now);
    }
  }

  // isWeekend: 요일 + custom_holidays + force_weekend 모두 반영
  const customHols = appConfig.custom_holidays || [];
  const isWeekend = [0, 6].includes(getKSTParts().day)
    || customHols.includes(todayStr())
    || !!appConfig.force_weekend;

  return {
    stop, setStop,
    lineId, setLineId,
    schedule, nextIdx, now,
    subwayArrivals, subwayOffPeak,
    needsSubway,
    loadErr,
    isLoading: !allData && !loadErr,
    isSubwayLoading,
    isGpsLoading,
    isHolidayServer,
    isWeekend,
    visibleCount,
    loadMore,
    isFullMode,
    setIsFullMode,
    fullDayType,
    setFullDayType,
    fullPeriod,
    setFullPeriod,
    appConfig,
  };
}
