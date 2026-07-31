// 도메인 엔티티: 셔틀 노선 상수 및 순수 시간표 계산 함수
import { getKSTParts, getKSTDateKey } from '../../utils/time.js';

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

export interface SubwayOpt {
  id: string;
  line: string;
  color: string;
  dest: string;
  dir: string;
  shortDest: string;
  subwayId: string;
  updnLine: string;
}

// shuttle.json 원본 행을 정규화한 도메인 셔틀 행
export interface ShuttleRow {
  route: string;
  period: string;
  dayType: string;
  dep: string;
}

// ShuttleDataSource의 raw 응답을 도메인 엔티티로 변환 — 지금은 필드가 그대로 대응되지만,
// 나중에 실제 백엔드 API가 다른 필드명/형식으로 내려줘도 이 함수만 고치면 나머지 도메인
// 로직(computeSchedule 등)은 안 바뀜
export function createShuttleRow(raw: { route: string; period: string; dayType: string; dep: string }): ShuttleRow {
  return {
    route: raw.route,
    period: raw.period,
    dayType: raw.dayType,
    dep: raw.dep,
  };
}

// 지하철 도착 정보 도메인 엔티티 (raw 응답은 ShuttleDataSource의 SubwayArrivalApiItem)
export interface SubwayArrival {
  subwayId: string;
  updnLine: string;
  dest: string;
  arrTime: string;
  trainNo: string;
  isRealtime: boolean;
}

export function createSubwayArrival(raw: {
  subwayId: string;
  updnLine: string;
  dest: string;
  arrTime: string;
  trainNo: string;
  isRealtime: boolean;
}): SubwayArrival {
  return {
    subwayId: raw.subwayId,
    updnLine: raw.updnLine,
    dest: raw.dest,
    arrTime: raw.arrTime,
    trainNo: raw.trainNo,
    isRealtime: raw.isRealtime,
  };
}

export interface ScheduleItem {
  depMin: number;
  dep: string;
  arr: string;
  arrLabel: string;
  subway: boolean;
  route: string;
}

export interface FullScheduleItem extends ScheduleItem {
  isLast: boolean;
}

export interface ShuttleAppConfig {
  current_period?: string;
  custom_holidays?: string[];
  force_weekend?: boolean;
  no_operation_days?: string[];
  force_no_operation?: boolean;
}

// connectingTrains가 필요로 하는 최소 구조 (실제 값은 위 SubwayArrival)
export interface SubwayArrivalLike {
  subwayId: string;
  updnLine: string;
  arrTime: string;
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

export const SUBWAY_OPTS: SubwayOpt[] = [
  { id: 'line4-bulam', line: '4호선',    color: '#33AADF', dest: '불암산행', dir: '상행', shortDest: '불암산', subwayId: '1004', updnLine: '상행' },
  { id: 'line4-oido',  line: '4호선',    color: '#33AADF', dest: '오이도행', dir: '하행', shortDest: '오이도', subwayId: '1004', updnLine: '하행' },
  { id: 'sb-wang',     line: '수인분당선', color: '#F5A623', dest: '왕십리행', dir: '상행', shortDest: '왕십리', subwayId: '1075', updnLine: '상행' },
  { id: 'sb-incheon',  line: '수인분당선', color: '#F5A623', dest: '인천행',   dir: '하행', shortDest: '인천',   subwayId: '1075', updnLine: '하행' },
];

// ── 순수 헬퍼 함수 ──
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

// 현재 날짜 문자열 (YYYY-MM-DD, KST 기준)
const getYYYYMMDD = () => getKSTDateKey();

// ── 공통: allData를 displayStop 기준 시간 목록으로 매핑 ──
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

// 셔틀 도착 이후 연결 가능한 지하철 편 필터 (순수 함수)
export function connectingTrains<T extends SubwayArrivalLike>(subwayArrivals: T[], shuttleArrTime: string, lineId: string): T[] {
  if (!subwayArrivals?.length) return [];
  const opt = SUBWAY_OPTS.find(o => o.id === lineId);
  if (!opt) return [];
  const arrM = toMin(shuttleArrTime);
  return subwayArrivals
    .filter(tr => tr.subwayId === opt.subwayId && tr.updnLine === opt.updnLine)
    .filter(tr => toMin(tr.arrTime) >= arrM)
    .slice(0, 2);
}
