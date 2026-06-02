// 훅(ViewModel): 셔틀 시간표 로딩·정류장 선택·지하철 연동 상태 관리
import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { computeSchedule, computeFullSchedule, curMin } from '../../domain/entities/Shuttle.js';
import { getShuttleDataUseCase, getSubwayArrivalsUseCase } from '../../di.js';
import { useBoot } from '../context/BootContext.jsx';

const STATION_COORDS = {
  '기숙사': { lat: 37.293338, lon: 126.836230 },
  '셔틀콕': { lat: 37.298737, lon: 126.837870 },
  '한대앞': { lat: 37.309650, lon: 126.852108 },
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km 단위
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

  useEffect(() => {
    if (appConfig.current_period) {
      setTimeout(() => {
        setFullPeriod(appConfig.current_period);
      }, 0);
    }
  }, [appConfig.current_period]);

  // 지오로케이션으로 현재 위치 판단하여 셔틀 정류장 자동 선택 (셔틀 탭 활성화 시에만 지연 로드)
  useEffect(() => {
    if (!isActive) return;

    Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 })
      .then((position) => {
        const { latitude, longitude } = position.coords;
        
        let closestStop = '한대앞';
        let minDistance = Infinity;
        const stopsToCheck = ['기숙사', '셔틀콕', '한대앞'];
        const distances = {};

        stopsToCheck.forEach(sName => {
          const coord = STATION_COORDS[sName];
          const dist = getDistance(latitude, longitude, coord.lat, coord.lon);
          distances[sName] = dist;
          if (dist < minDistance) {
            minDistance = dist;
            closestStop = sName;
          }
        });

        const allOver1km = stopsToCheck.every(sName => distances[sName] >= 1.0);

        if (allOver1km) {
          setStopState('한대앞');
        } else {
          setStopState(closestStop);
        }
      })
      .catch((error) => {
        // 위치 권한이 꺼져 있거나 오류가 난 경우에는 localStorage의 이전 저장값을 그대로 유지하기 위해 덮어쓰지 않습니다.
        console.warn('Geolocation failed or permission denied. Retaining localStorage stop.', error);
      });
  }, [isActive]);

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

  // 1분마다 현재 시각 갱신
  useEffect(() => {
    const id = setInterval(() => setNow(curMin()), 60_000);
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
        // 기본 dayType 초기화 (한 번만)
        if (!fullMode && isFullMode === false) {
           setFullDayType(d.isHoliday || [0,6].includes(new Date().getDay()) ? '주말' : '평일');
        }
      })
      .catch(() => {})
      .finally(() => setIsSubwayLoading(false));
  }, [isFullMode, fullDayType]);

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

  const isWeekend = [0, 6].includes(new Date().getDay());

  return {
    stop, setStop,
    lineId, setLineId,
    schedule, nextIdx, now,
    subwayArrivals, subwayOffPeak,
    needsSubway,
    loadErr,
    isLoading: !allData && !loadErr,
    isSubwayLoading,
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
