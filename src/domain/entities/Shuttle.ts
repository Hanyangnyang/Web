// 도메인 엔티티: 셔틀 노선 상수 및 순수 시간표 계산 함수
import { getKSTParts, getKSTDateKey } from '../../utils/kstTime.js';
import { getDistanceKm } from '../utils/haversine.js';

export interface Coords {
  latitude: number;
  longitude: number;
}

// 셔틀이 정차하는 지점의 좌표 — 이름이 같아도 일반버스 정류소(PublicBus.ts의 STOP_COORDS)와는 실제 위치가 다르다
export const STATION_COORDS: Record<string, { lat: number; lon: number }> = {
  '기숙사': { lat: 37.293338, lon: 126.836230 },
  '셔틀콕': { lat: 37.298737, lon: 126.837870 },
  '한대앞': { lat: 37.309650, lon: 126.852108 },
};

// 좌표 기준 가장 가까운 셔틀 정류장. 모든 정류장이 1km 이상이면(캠퍼스 밖) '한대앞' 고정
export const pickClosestStop = ({ latitude, longitude }: Coords): string => {
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

export interface RouteStopDef {
  name: string;
  off: number;
  arrLabel: string;
  arrOff: number;
  subway: boolean;
}

export interface RouteDef {
  stops: RouteStopDef[];
}

export interface ShuttleRow {
  route: string;
  period: string;
  dayType: string;
  dep: string;
}

export function createShuttleRow(raw: { route: string; period: string; dayType: string; dep: string }): ShuttleRow {
  return {
    route: raw.route,
    period: raw.period,
    dayType: raw.dayType,
    dep: raw.dep,
  };
}

export interface ScheduleItem {
  depMin: number;
  dep: string;  // 출발시각
  arr: string;  // 다음 정류장 도착시각
  arrLabel: string;  // 다음 정류장 이름 
  subway: boolean;   // 그 정류장에서 지하철 연결 가능한지 플래그
  route: string;     // 노선명 
}

export interface FullScheduleItem extends ScheduleItem {
  isLast: boolean;  // 막차여부 
}

export interface ShuttleAppConfig {
  current_period?: string;
  custom_holidays?: string[];
  force_weekend?: boolean;
  no_operation_days?: string[];
  force_no_operation?: boolean;
}

// 화면에 표시되는 정류장 목록
export const STOPS = ['기숙사', '셔틀콕', '한대앞', '셔틀콕 건너편', '예술인', '중앙역'];

// ── 노선 정의 ──
// stops: 이 노선이 경유하는 정류장 (순서대로)
// off:   첫 정류장 출발 기준 누적 소요 분
// arrLabel: 이 정류장에서 표시할 '다음 목적지' 이름
// arrOff:   이 정류장 출발 → arrLabel 도착까지 분
// subway:   arrLabel이 지하철 연결 가능한 정류장이면 true
export const ROUTE_DEFS: Record<string, RouteDef> = {
  '순환': {
    stops: [
      { name: '기숙사',      off: 0,  arrLabel: '한대앞역',      arrOff: 15, subway: true  },
      { name: '셔틀콕',      off: 5,  arrLabel: '한대앞역',      arrOff: 10, subway: true  },
      { name: '한대앞',      off: 15, arrLabel: '예술인',        arrOff: 5,  subway: false },
      { name: '예술인',      off: 20, arrLabel: '셔틀콕 건너편', arrOff: 10, subway: false },
      { name: '셔틀콕 건너편', off: 30, arrLabel: '기숙사',       arrOff: 5,  subway: false },
    ],
  },
  '직행': {
    stops: [
      { name: '기숙사',      off: 0,  arrLabel: '한대앞역',      arrOff: 15, subway: true  },
      { name: '셔틀콕',      off: 5,  arrLabel: '한대앞역',      arrOff: 10, subway: true  },
      { name: '한대앞',      off: 15, arrLabel: '셔틀콕 건너편', arrOff: 10, subway: false },
      { name: '셔틀콕 건너편', off: 25, arrLabel: '기숙사',       arrOff: 5,  subway: false },
    ],
  },
  '예술인직행': {
    stops: [
      { name: '기숙사',      off: 0,  arrLabel: '예술인',        arrOff: 15, subway: false },
      { name: '셔틀콕',      off: 5,  arrLabel: '예술인',        arrOff: 10, subway: false },
      { name: '예술인',      off: 15, arrLabel: '셔틀콕 건너편', arrOff: 10, subway: false },
      { name: '셔틀콕 건너편', off: 25, arrLabel: '기숙사',       arrOff: 5,  subway: false },
    ],
  },
  '중앙역': {
    stops: [
      { name: '기숙사',      off: 0,  arrLabel: '한대앞역',      arrOff: 15, subway: true  },
      { name: '셔틀콕',      off: 5,  arrLabel: '한대앞역',      arrOff: 10, subway: true  },
      { name: '한대앞',      off: 15, arrLabel: '중앙역',        arrOff: 3,  subway: false },
      { name: '중앙역',      off: 18, arrLabel: '셔틀콕 건너편', arrOff: 10, subway: false },
      { name: '셔틀콕 건너편', off: 28, arrLabel: '기숙사',       arrOff: 5,  subway: false },
    ],
  },
  '아침직행': {
    stops: [
      { name: '셔틀콕',      off: 0,  arrLabel: '한대앞역',      arrOff: 10, subway: true  },
      { name: '한대앞',      off: 10, arrLabel: '셔틀콕 건너편', arrOff: 10, subway: false },
      { name: '셔틀콕 건너편', off: 20, arrLabel: '종착',         arrOff: 0,  subway: false },
    ],
  },
  '아침예술인': {
    stops: [
      { name: '셔틀콕',      off: 0,  arrLabel: '예술인',        arrOff: 10, subway: false },
      { name: '예술인',      off: 10, arrLabel: '셔틀콕 건너편', arrOff: 10, subway: false },
      { name: '셔틀콕 건너편', off: 20, arrLabel: '종착',         arrOff: 0,  subway: false },
    ],
  },
};

// STOPS 중 지하철 연결정보가 필요한 정류장 — ROUTE_DEFS에서 subway:true인 구간의 출발 정류장만 뽑아 도출.
// 노선이 추가/변경돼도 이 줄을 손댈 필요 없이 항상 최신 상태를 반영한다.
export const SUBWAY_CONNECTED_STOPS = [...new Set(
  Object.values(ROUTE_DEFS).flatMap(def => def.stops.filter(s => s.subway).map(s => s.name))
)];

export const toMin  = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const curMin = () => { const { hours, minutes } = getKSTParts(); return hours * 60 + minutes; };

export const dayType = (isHolidayServer: boolean | null, customHolidays: string[] = [], forceWeekend = false) => {
  if (forceWeekend) return '주말';
  if (isHolidayServer === true) return '주말';

  const { day } = getKSTParts();
  if (customHolidays.includes(getKSTDateKey())) return '주말';

  return (day === 0 || day === 6) ? '주말' : '평일';
};

const pad2      = (n: number) => String(n).padStart(2, '0');
const intToHHMM = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`;
const getYYYYMMDD = () => getKSTDateKey();

// 공통: allData를 displayStop 기준 시간 목록으로 매핑 
function mapToScheduleItems(rows: ShuttleRow[], displayStop: string): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  for (const row of rows) {
    const routeDef = ROUTE_DEFS[row.route];
    if (!routeDef) continue;

    const stopDef = routeDef.stops.find(s => s.name === displayStop);
    if (!stopDef) continue; // 이 노선은 displayStop을 경유하지 않음

    const depMin = toMin(row.dep) + stopDef.off;
    const arrMin = depMin + stopDef.arrOff;

    items.push({
      depMin,
      dep:      intToHHMM(Math.floor(depMin / 60), depMin % 60),
      arr:      intToHHMM(Math.floor(arrMin / 60), arrMin % 60),
      arrLabel: stopDef.arrLabel,
      subway:   stopDef.subway,
      route:    row.route,
    });
  }
  return items.sort((a, b) => a.depMin - b.depMin);
}

// 현재 시각 근처의 셔틀 계산 (순수 함수)
export function computeSchedule(
  allData: ShuttleRow[],
  displayStop: string,
  nowMinutes: number,
  isHolidayServer: boolean | null,
  lookbackMinutes = 0,
  appConfig: ShuttleAppConfig = {},
): ScheduleItem[] {
  const noOpDays = appConfig.no_operation_days || [];
  if (appConfig.force_no_operation || noOpDays.includes(getYYYYMMDD())) return [];

  const period       = appConfig.current_period || '학기중';
  const customHols   = appConfig.custom_holidays || [];
  const forceWeekend = appConfig.force_weekend || false;
  const currentDay   = dayType(isHolidayServer, customHols, forceWeekend);

  const filtered = allData.filter(d => d.period === period && d.dayType === currentDay);
  const allMapped = mapToScheduleItems(filtered, displayStop);

  const nextIdx = allMapped.findIndex(r => r.depMin >= nowMinutes);

  if (nextIdx === -1) {
    // 모든 셔틀이 과거인 경우
    const past = allMapped.filter(r => r.depMin >= nowMinutes - lookbackMinutes);
    if (past.length === 0 && allMapped.length > 0) return [allMapped[allMapped.length - 1]];
    return past;
  }

  const pastCandidates = allMapped.slice(0, nextIdx);
  const upcoming       = allMapped.slice(nextIdx);

  let filteredPast = pastCandidates.filter(r => r.depMin >= nowMinutes - lookbackMinutes);
  if (filteredPast.length === 0 && pastCandidates.length > 0) {
    filteredPast = [pastCandidates[pastCandidates.length - 1]];
  } else if (filteredPast.length > 1) {
    filteredPast = filteredPast.slice(-1);
  }

  return filteredPast.concat(upcoming);
}

// 전체 시간표 계산 (순수 함수)
export function computeFullSchedule(
  allData: ShuttleRow[],
  displayStop: string,
  dayTypeStr: string,
  appConfig: ShuttleAppConfig = {},
  overridePeriod: string | null = null,
): FullScheduleItem[] {
  const period           = overridePeriod || appConfig.current_period || '학기중';
  const normalizedDayType = dayTypeStr === '주말/공휴일' ? '주말' : dayTypeStr;

  const filtered = allData.filter(d => d.period === period && d.dayType === normalizedDayType);
  const allMapped = mapToScheduleItems(filtered, displayStop);

  const lastMin = allMapped.length > 0 ? allMapped[allMapped.length - 1].depMin : -1;
  return allMapped.map(r => ({ ...r, isLast: r.depMin === lastMin }));
}
