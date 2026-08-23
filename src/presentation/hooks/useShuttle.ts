// 훅(ViewModel): 셔틀 시간표 로딩·정류장 선택·지하철 연동 상태 관리
import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { computeSchedule, computeFullSchedule, curMin, dayType, pickClosestStop, type ScheduleItem } from '../../domain/entities/Shuttle.js';
import { getShuttleDataUseCase, getSubwayScheduleUseCase } from '../../di.js';
import { useBoot } from '../context/BootContext.jsx';
import { useLocation } from './useLocation.js';
import { useHoliday } from './useHoliday.js';

const BUS_STALE_TIME = 12 * 60 * 60 * 1000; // 12시간 — 백엔드가 셔틀버스 시간표를 정확히 이 주기로 캐싱한다고 확인함(관리자가 시간표 CRUD할 때만 캐시 삭제)
const SUBWAY_STALE_TIME = 12 * 60 * 60 * 1000; // 12시간 — 백엔드가 지하철 시간표를 정확히 이 주기로 캐싱한다고 확인함(station:line:direction:dayType 키), 그보다 더 길게 잡으면 백엔드가 이미 갱신한 데이터를 우리만 늦게 받게 됨

const SCHEDULE_QUERY_KEY = ['shuttle', 'schedule'];
const SUBWAY_SCHEDULE_QUERY_KEY = ['shuttle', 'subway-schedule'];

// Prefetch 함수
export function prefetchShuttleSchedule() {
  return queryClient.prefetchQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: () => getShuttleDataUseCase.execute(),
    staleTime: BUS_STALE_TIME,
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

  // 셔틀 시간표 (백엔드 API — staleTime 내에서 재요청 없음)
  const scheduleQuery = useQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: () => getShuttleDataUseCase.execute(),
    staleTime: BUS_STALE_TIME,
  });
  const allData = scheduleQuery.data ?? null;
  const loadErr = scheduleQuery.isError ? '셔틀 시간표를 불러오지 못했습니다.' : null;

  // 10초마다 현재 시각 갱신 (시간 경과가 UI에 즉각 반영되도록 주기 단축)
  useEffect(() => {
    const id = setInterval(() => setNow(curMin()), 10_000);
    return () => clearInterval(id);
  }, []);

  // 지하철 연결정보가 필요한 정류장(기숙사·셔틀콕)에서만 전체 시간표를 받아옴
  const needsSubway = stop === '기숙사' || stop === '셔틀콕';

  // 오늘이 법정공휴일인지 (새 백엔드는 셔틀·지하철 둘 다 이 값을 직접 안 내려주므로 별도 조회) — 모드와 무관하게 항상 필요
  const { isHoliday: isHolidayServer, isLoading: isHolidayLoading } = useHoliday();
  const customHols = appConfig.custom_holidays || [];

  // 지하철 전체 시간표 (새 백엔드 — 정적 데이터, 폴링 없음. 백엔드 캐시 TTL(12시간)에 맞춤)
  const subwayScheduleQuery = useQuery({
    queryKey: SUBWAY_SCHEDULE_QUERY_KEY,
    queryFn: () => getSubwayScheduleUseCase.execute(),
    staleTime: SUBWAY_STALE_TIME,
    enabled: needsSubway,
  });

  // 지하철 연결편 조회는 셔틀의 custom_holidays(학교 자체 기념일) 미리보기와 무관하게
  // 항상 실제 요일/법정공휴일 기준을 따른다 — 학교 기념일이어도 열차는 평일대로 다니므로
  const trainDayType = dayType(isHolidayServer, [], !!appConfig.force_weekend);

  // 일반 모드에서만 셔틀 dayType(custom_holidays 포함)을 fullDayType에 동기화 (전체 모드 진입 시엔 사용자가 직접 고름)
  useEffect(() => {
    if (isFullMode || isHolidayLoading) return;
    setFullDayType(dayType(isHolidayServer, customHols, !!appConfig.force_weekend));
  }, [isFullMode, isHolidayLoading, isHolidayServer, appConfig]); // eslint-disable-line react-hooks/exhaustive-deps -- customHols는 appConfig에서 매 렌더 파생되는 값이라 appConfig 의존성으로 충분

  // 전체 정적 시간표에서 오늘(실제) dayType에 해당하는 열차만 남김 — 특정 노선/방향/시각 필터링은 TimetableRow의 connectingTrains()가 담당
  const subwayArrivals = (subwayScheduleQuery.data ?? []).filter(r => r.dayType === trainDayType);
  const subwayOffPeak = false; // 구 API도 이 필드를 내려준 적이 없어 항상 false였음 — 동작 변화 없음
  const isSubwayLoading = subwayScheduleQuery.isFetching;

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

  // isWeekend: dayType() 판정 결과(force_weekend/isHolidayServer/custom_holidays/요일 모두 반영)와 동일
  const isWeekend = dayType(isHolidayServer, customHols, !!appConfig.force_weekend) === '주말';

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
