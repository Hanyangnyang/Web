// 훅(ViewModel): 셔틀 시간표 로딩·정류장 선택·지하철 연동 상태 관리
import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { computeSchedule, computeFullSchedule, curMin } from '../../domain/entities/Shuttle.js';
import { getDistanceKm } from '../../domain/utils/geo.js';
import { getShuttleDataUseCase, getSubwayArrivalsUseCase } from '../../di.js';
import { useBoot } from '../context/BootContext.jsx';
import { useLocation } from './useLocation.js';

// 셔틀이 정차하는 지점의 좌표 — 이름이 같아도 일반버스 정류소(ShuttleView의 STOP_COORDS)와는 실제 위치가 다르다
const STATION_COORDS = {
  '기숙사': { lat: 37.293338, lon: 126.836230 },
  '셔틀콕': { lat: 37.298737, lon: 126.837870 },
  '한대앞': { lat: 37.309650, lon: 126.852108 },
};

// 좌표 기준 가장 가까운 셔틀 정류장. 모든 정류장이 1km 이상이면(캠퍼스 밖) '한대앞' 고정
const pickClosestStop = ({ latitude, longitude }) => {
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

export function useShuttle(isActive = false) {
  const { appConfig } = useBoot();
  const [stop,   setStopState]  = useState(() => localStorage.getItem('shuttle_stop') || '한대앞');
  const [lineId, setLineIdState] = useState(() => localStorage.getItem('shuttle_lineId') || 'line4-bulam');
  const [allData,         setAllData]         = useState(null);
  const [subwayArrivals,  setSubwayArrivals]  = useState([]);
  const [subwayOffPeak,   setSubwayOffPeak]   = useState(false);
  const [isSubwayLoading, setIsSubwayLoading] = useState(false);
  const [isHolidayServer, setIsHolidayServer] = useState(null);
  const [now,             setNow]             = useState(curMin);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loadErr,         setLoadErr]         = useState(null);
  const [isFullMode,      setIsFullMode]      = useState(false);
  const [fullDayType,     setFullDayType]     = useState('평일');
  const [fullPeriod,      setFullPeriod]      = useState(appConfig.current_period);

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

  const setStop = (s) => { 
    setStopState(s); 
    localStorage.setItem('shuttle_stop', s); 
    setVisibleCount(5); // 정류장 변경 시 초기화
  };
  const setLineId = (l) => { setLineIdState(l); localStorage.setItem('shuttle_lineId', l); };

  // 셔틀 시간표 최초 로드
  useEffect(() => {
    getShuttleDataUseCase.execute()
      .then(setAllData)
      .catch(() => setLoadErr('셔틀 시간표를 불러오지 못했습니다.'));
  }, []);

  // 10초마다 현재 시각 갱신 (시간 경과가 UI에 즉각 반영되도록 주기 단축)
  useEffect(() => {
    const id = setInterval(() => setNow(curMin()), 10_000);
    return () => clearInterval(id);
  }, []);

  // 지하철 도착 정보 (2분 주기, 기숙사·셔틀콕만 필요)
  const needsSubway = stop === '기숙사' || stop === '셔틀콕';
  const fetchSubway = useCallback((fullMode = isFullMode, dayTypeStr = fullDayType) => {
    setIsSubwayLoading(true);
    getSubwayArrivalsUseCase.execute(fullMode, fullMode ? dayTypeStr : null)
      .then(d => { 
        setSubwayArrivals(d.arrivals); 
        setSubwayOffPeak(d.offPeak); 
        setIsHolidayServer(d.isHoliday ?? false);
        // 기본 dayType 초기화 (한 번만) — custom_holidays, force_weekend 포함
        if (!fullMode && isFullMode === false) {
          const today = new Date();
          const yyyymmdd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
          const customHols = appConfig.custom_holidays || [];
          const isHol = d.isHoliday
            || [0, 6].includes(today.getDay())
            || customHols.includes(yyyymmdd)
            || !!appConfig.force_weekend;
          setFullDayType(isHol ? '주말' : '평일');
        }
      })
      .catch(() => {})
      .finally(() => setIsSubwayLoading(false));
  }, [isFullMode, fullDayType, appConfig]);

  useEffect(() => {
    // 무조건 한 번 호출해서 isHoliday 서버 상태를 가져오고, needsSubway면 2분마다 갱신
    setTimeout(() => {
      fetchSubway(isFullMode, fullDayType);
    }, 0);
    let id;
    if (needsSubway && !isFullMode) {
      id = setInterval(() => fetchSubway(false, null), 2 * 60_000);
    }
    return () => { if (id) clearInterval(id); };
  }, [needsSubway, fetchSubway, isFullMode, fullDayType]);

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 5);
  }, []);

  const lookback = 15;
  let schedule = [];
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
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const customHols = appConfig.custom_holidays || [];
  const isWeekend = [0, 6].includes(today.getDay())
    || customHols.includes(todayStr)
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
