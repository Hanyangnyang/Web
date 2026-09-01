// 도메인 엔티티: 지하철 노선 상수 및 연결편 계산 함수
import { toMin } from './Shuttle.js';

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

export const SUBWAY_OPTS: SubwayOpt[] = [
  { id: 'line4-bulam', line: '4호선',    color: '#33AADF', dest: '불암산행', dir: '상행', shortDest: '불암산', subwayId: '1004', updnLine: '상행' },
  { id: 'line4-oido',  line: '4호선',    color: '#33AADF', dest: '오이도행', dir: '하행', shortDest: '오이도', subwayId: '1004', updnLine: '하행' },
  { id: 'sb-wang',     line: '수인분당선', color: '#F5A623', dest: '왕십리행', dir: '상행', shortDest: '왕십리', subwayId: '1075', updnLine: '상행' },
  { id: 'sb-incheon',  line: '수인분당선', color: '#F5A623', dest: '인천행',   dir: '하행', shortDest: '인천',   subwayId: '1075', updnLine: '하행' },
];

export interface SubwayScheduleRow {
  subwayId: string;  // '1004' | '1075'
  updnLine: string;  // '상행' | '하행'
  dayType: string;   // '평일' | '주말'
  arrTime: string;   // 'HH:mm'
  dest: string;
  trainNo: string;
}

export function createSubwayScheduleRow(raw: {
  subwayId: string;
  updnLine: string;
  dayType: string;
  arrTime: string;
  dest: string;
  trainNo: string;
}): SubwayScheduleRow {
  return {
    subwayId: raw.subwayId,
    updnLine: raw.updnLine,
    dayType: raw.dayType,
    arrTime: raw.arrTime,
    dest: raw.dest,
    trainNo: raw.trainNo,
  };
}

export interface SubwayArrivalLike {
  subwayId: string;
  updnLine: string;
  arrTime: string;
}

// 수인분당선 시간표 개정 미반영으로 임시로 연결편 표시를 막을 때 사용 (연결 시각 숨김 + 공지 배너 노출 트리거)
export function isSuinBundangLine(lineId: string): boolean {
  return SUBWAY_OPTS.find(o => o.id === lineId)?.line === '수인분당선';
}

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

// connectingTrains() 결과가 0개일 때, 그 노선/방향 자체의 데이터가 없는 것(연결 열차 없음)과
// 데이터는 있지만 셔틀 도착 시각까지 막차가 이미 지난 것(운행 시간 외)을 구분한다
export function isSubwayOffPeak<T extends SubwayArrivalLike>(subwayArrivals: T[], shuttleArrTime: string, lineId: string): boolean {
  const opt = SUBWAY_OPTS.find(o => o.id === lineId);
  if (!opt) return false;
  const lineArrivals = subwayArrivals.filter(tr => tr.subwayId === opt.subwayId && tr.updnLine === opt.updnLine);
  if (lineArrivals.length === 0) return false;
  const arrM = toMin(shuttleArrTime);
  return !lineArrivals.some(tr => toMin(tr.arrTime) >= arrM);
}
