// 훅(ViewModel): 셔틀 시간표 로딩·정류장 선택·지하철 연동 상태 관리
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import {
  computeSchedule, computeFullSchedule, curMin, pickClosestStop, SUBWAY_CONNECTED_STOPS,
  mapServerDayType, mapServerPeriodType, localWeekdayFallback, type ScheduleItem,
} from '../../domain/entities/Shuttle.js';
import { getShuttleDataUseCase, getSubwayScheduleUseCase } from '../../di.js';
import { useBoot } from '../context/BootContext.jsx';
import { useLocation } from './useLocation.js';
import { useAcademicStatus } from './useAcademicStatus.js';
import { useDateInfo } from './useDateInfo.js';
import { getKSTDateKey } from '../../utils/kstTime.js';

const BUS_STALE_TIME = 60 * 60 * 1000; // 1시간 — 백엔드 셔틀버스 캐시 TTL(12시간)보다 짧게 재검증. 관리자가 시간표 CRUD할 때만 백엔드 캐시가 지워지므로 대부분은 같은 값을 그대로 돌려받음
const SUBWAY_STALE_TIME = 60 * 60 * 1000; // 1시간 — 백엔드 지하철 시간표 캐시 TTL(12시간, station:line:direction:dayType 키)보다 짧게 재검증

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
  const { appConfig } = useBoot(); // 이제 period_schedule(다가오는 시간표 변경 배너용)만 담고 있음
  const [stop, setStopState] = useState(() => localStorage.getItem('shuttle_stop') || '한대앞');
  const [lineId, setLineIdState] = useState(() => localStorage.getItem('shuttle_lineId') || 'line4-bulam');
  const [now, setNow] = useState(curMin);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isFullMode, setIsFullMode] = useState(false);
  const [fullDayType, setFullDayType] = useState('평일');

  // 지하철 연결정보가 필요한 정류장(기숙사·셔틀콕)에서만 전체 시간표를 받아옴
  const needsSubway = SUBWAY_CONNECTED_STOPS.includes(stop);

  // 오늘의 학사/셔틀 통합 운영 상태 — 예전엔 Supabase app_config(현재기간·공휴일·강제주말·미운행 오버라이드)를
  // 프론트에서 직접 조합해서 판정했는데, 이제 이 값 하나로 백엔드가 전부 계산해서 내려준다.
  // 모드와 무관하게 항상 필요(전체 모드 진입 시 기본값 동기화에도 씀)
  const { data: academicStatus, isStale: isAcademicStatusStale, refetch: refetchAcademicStatus } = useAcademicStatus();
  const currentPeriod = academicStatus ? mapServerPeriodType(academicStatus.academic.periodType) : '학기중';
  const shuttleDayType = academicStatus ? mapServerDayType(academicStatus.shuttle.dayType) : localWeekdayFallback();
  const isShuttleOperating = academicStatus ? academicStatus.shuttle.isOperating : true;

  // 셔틀화면이 열릴 때(isActive: false → true) 뱃지(학기중/평일 등)가 낡은 값이면 다시 받아온다.
  // academicStatus는 앱이 켜져있는 내내 마운트 상태라(다른 탭을 봐도 화면만 숨겨질 뿐), 탭을 왔다갔다
  // 하는 것만으로는 React Query의 "마운트 시 재검증"이 다시 발동하지 않아서 별도로 챙겨줘야 한다
  useEffect(() => {
    if (isActive && isAcademicStatusStale) refetchAcademicStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isAcademicStatusStale/refetchAcademicStatus는 매 렌더 새 값이라 deps에 넣으면 매 렌더 실행됨. isActive가 바뀌는 시점에만 검사하면 충분
  }, [isActive]);

  // 셔틀화면을 계속 띄워놓은 채로 자정을 넘기는 경우(예: 11:50pm부터 계속 보고 있다가 12시가 지남)까지
  // 잡기 위해, 화면이 활성 상태인 동안만 KST 날짜가 바뀌었는지 10초마다 확인해 academicStatus를 다시
  // 받아온다 — 그러면 뱃지(학기중/평일 등)가 자정에 자동으로 새 값으로 갱신된다. 화면이 안 보일 때는
  // 이 타이머 자체를 안 돌려서 불필요한 재요청을 막는다. 지하철(date-info)은 이 정도 실시간성까지는
  // 필요 없다고 판단해 별도로 안 둠 — 다음에 그 정류장을 고를 때 자연히 최신값을 받아온다
  useEffect(() => {
    if (!isActive) return;
    let lastDateKey = getKSTDateKey();
    const id = setInterval(() => {
      const today = getKSTDateKey();
      if (today !== lastDateKey) {
        lastDateKey = today;
        refetchAcademicStatus();
      }
    }, 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetchAcademicStatus는 매 렌더 새 참조라 deps에 넣으면 타이머가 계속 재시작됨
  }, [isActive]);

  // 지하철 연결편 조회는 셔틀 전용 오버라이드(학교 자체 기념일 등)와 무관하게 항상 실제 공휴일 달력 기준을
  // 따른다 — 학교 기념일이어도 열차는 평일대로 다니므로. academic/status.calendar는 학교 자체 공휴일까지
  // 섞여 내려와서 못 쓰고, 순수 공공기념일 기준인 date-info를 따로 조회한다. 지하철 연결정보가 필요할 때만 요청.
  const { data: dateInfo } = useDateInfo(undefined, needsSubway && isActive);
  const trainDayType = dateInfo ? mapServerDayType(dateInfo.dayType) : localWeekdayFallback();

  // 학기/기간·dayType이 실제로 "바뀌는 순간"에만 셔틀·지하철 시간표를 강제로 다시 받아온다.
  // staleTime(1시간)만 믿으면, 관리자가 전환 시점 직전에 새 기간 데이터를 올려도 캐시가 안 지났다는
  // 이유로 옛 내용을 계속 보여줄 수 있음 — 그 확률적인 갭을 없애기 위해 실제 전환 이벤트에 직접 반응한다.
  const prevShuttleKey = useRef<string | null>(null);
  useEffect(() => {
    if (!academicStatus) return;
    const key = `${currentPeriod}:${shuttleDayType}:${isShuttleOperating}`;
    if (prevShuttleKey.current !== null && prevShuttleKey.current !== key) {
      queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEY });
    }
    prevShuttleKey.current = key;
  }, [academicStatus, currentPeriod, shuttleDayType, isShuttleOperating]);

  const prevTrainDayType = useRef<string | null>(null);
  useEffect(() => {
    if (!dateInfo) return;
    if (prevTrainDayType.current !== null && prevTrainDayType.current !== trainDayType) {
      queryClient.invalidateQueries({ queryKey: SUBWAY_SCHEDULE_QUERY_KEY });
    }
    prevTrainDayType.current = trainDayType;
  }, [dateInfo, trainDayType]);

  const [fullPeriod, setFullPeriod] = useState(currentPeriod);

  const { coords, isLocating: isGpsLoading } = useLocation(isActive);

  useEffect(() => {
    if (currentPeriod) {
      setTimeout(() => {
        setFullPeriod(currentPeriod);
      }, 0);
    }
  }, [currentPeriod]);

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

  // 셔틀 시간표 (백엔드 API — staleTime 내에서 재요청 없음, 셔틀탭 진입 시에만 요청)
  const scheduleQuery = useQuery({
    queryKey: SCHEDULE_QUERY_KEY,
    queryFn: () => getShuttleDataUseCase.execute(),
    staleTime: BUS_STALE_TIME,
    enabled: isActive,
  });
  const allData = scheduleQuery.data ?? null;
  const loadErr = scheduleQuery.isError ? '셔틀 시간표를 불러오지 못했습니다' : null;
  const refetchSchedule = () => { scheduleQuery.refetch(); };

  // 10초마다 현재 시각 갱신 (시간 경과가 UI에 즉각 반영되도록 주기 단축)
  useEffect(() => {
    const id = setInterval(() => setNow(curMin()), 10_000);
    return () => clearInterval(id);
  }, []);

  // 지하철 전체 시간표 (새 백엔드 — 정적 데이터, 폴링 없음. 백엔드 캐시 TTL(12시간)에 맞춤)
  const subwayScheduleQuery = useQuery({
    queryKey: SUBWAY_SCHEDULE_QUERY_KEY,
    queryFn: () => getSubwayScheduleUseCase.execute(),
    staleTime: SUBWAY_STALE_TIME,
    enabled: needsSubway && isActive,
  });

  // 일반 모드에서만 셔틀 dayType을 fullDayType에 동기화 (전체 모드 진입 시엔 사용자가 직접 고름)
  useEffect(() => {
    if (isFullMode || !academicStatus) return;
    setFullDayType(shuttleDayType);
  }, [isFullMode, academicStatus, shuttleDayType]);

  // 전체 정적 시간표에서 오늘(실제) dayType에 해당하는 열차만 남김 — 특정 노선/방향/시각 필터링은 TimetableRow의 connectingTrains()가 담당
  const subwayArrivals = (subwayScheduleQuery.data ?? []).filter(r => r.dayType === trainDayType);
  const isSubwayLoading = subwayScheduleQuery.isFetching;
  const isSubwayError = subwayScheduleQuery.isError;
  const refetchSubway = () => { subwayScheduleQuery.refetch(); };

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 5);
  }, []);

  const lookback = 15;
  let schedule: ScheduleItem[] = [];
  let nextIdx = -1;

  if (allData) {
    if (isFullMode) {
      schedule = computeFullSchedule(allData, stop, fullDayType, currentPeriod, fullPeriod);
      nextIdx = -1; // 전체 모드에서는 다음 셔틀 하이라이트 안 함
    } else {
      schedule = computeSchedule(allData, stop, now, shuttleDayType, isShuttleOperating, lookback, currentPeriod);
      nextIdx = schedule.findIndex(r => r.depMin >= now);
    }
  }

  // isWeekend: shuttleDayType(academic/status.shuttle.dayType 판정 결과)과 동일
  const isWeekend = shuttleDayType === '주말';

  return {
    stop, setStop,
    lineId, setLineId,
    schedule, nextIdx, now,
    subwayArrivals,
    needsSubway,
    loadErr,
    refetchSchedule,
    isLoading: !allData && !loadErr,
    isSubwayLoading,
    isSubwayError,
    refetchSubway,
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
    appConfig: { current_period: currentPeriod, period_schedule: appConfig.period_schedule },
  };
}
