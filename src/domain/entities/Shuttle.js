// 도메인 엔티티: 셔틀 노선 상수 및 순수 시간표 계산 함수
export const STOPS = ['기숙사', '셔틀콕', '한대앞', '셔틀콕 건너편', '예술인', '중앙역'];

export const STOP_SOURCE = {
  '기숙사':       '창의인재원',
  '셔틀콕':       '셔틀콕',
  '한대앞':       '한대앞역',
  '예술인':       '예술인APT',
  '셔틀콕 건너편': '한대앞역',
  '중앙역':       '셔틀콕',
};

export const SUBWAY_OPTS = [
  { id: 'line4-bulam', line: '4호선',    color: '#33AADF', dest: '불암산행', dir: '상행', shortDest: '불암산', subwayId: '1004', updnLine: '상행' },
  { id: 'line4-oido',  line: '4호선',    color: '#33AADF', dest: '오이도행', dir: '하행', shortDest: '오이도', subwayId: '1004', updnLine: '하행' },
  { id: 'sb-wang',     line: '수인분당선', color: '#F5A623', dest: '왕십리행', dir: '상행', shortDest: '왕십리', subwayId: '1075', updnLine: '상행' },
  { id: 'sb-incheon',  line: '수인분당선', color: '#F5A623', dest: '인천행',   dir: '하행', shortDest: '인천',   subwayId: '1075', updnLine: '하행' },
];

// ── 순수 헬퍼 함수 ── 
export const toMin   = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const curMin  = ()  => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
export const dayType = (isHolidayServer, customHolidays = [], forceWeekend = false)  => { 
  if (forceWeekend) return '주말';
  if (isHolidayServer === true) return '주말';

  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (customHolidays.includes(yyyymmdd)) return '주말';

  const d = now.getDay(); 
  return (d === 0 || d === 6) ? '주말' : '평일'; 
};

const pad2      = (n) => String(n).padStart(2, '0');
const intToHHMM = (h, m) => `${pad2(h)}:${pad2(m)}`;

// 출발지 기준으로 표시 정류장까지의 분 오프셋 
function depOffset(displayStop, route) {
  if (displayStop === '셔틀콕 건너편') {
    if (route === '중앙역') return 13;
    if (route === 'D')    return 10;
    return 15;
  }
  if (displayStop === '중앙역') return 13;
  return 0;
}

// 표시 정류장 기준 도착지 정보 
function arrivalInfo(displayStop, route) {
  switch (displayStop) {
    case '기숙사':
      if (route === 'DY') return { label: '예술인', min: 15, subway: false };
      return { label: '한대앞역', min: 15, subway: true };
    case '셔틀콕':
      if (route === 'DY') return { label: '예술인', min: 10, subway: false };
      return { label: '한대앞역', min: 10, subway: true };
    case '한대앞':
      if (route === '중앙역') return { label: '학교', min: 13, subway: false };
      if (route === 'D')    return { label: '학교', min: 10, subway: false };
      return                       { label: '학교', min: 15, subway: false };
    case '예술인':       return { label: '학교',   min: 10, subway: false };
    case '셔틀콕 건너편': return { label: '기숙사', min: 5,  subway: false };
    case '중앙역':       return { label: '학교',   min: 10, subway: false };
    default:             return { label: '도착',   min: 15, subway: false };
  }
}

// 현재 시각 근처의 셔틀 계산 (순수 함수)
export function computeSchedule(allData, displayStop, nowMinutes, isHolidayServer, lookbackMinutes = 0, appConfig = {}) {
  const period = appConfig.current_period || '학기중';
  const customHolidays = appConfig.custom_holidays || [];
  const forceWeekend = appConfig.force_weekend || false;

  const src = STOP_SOURCE[displayStop];
  let rows = allData.filter(d =>
    d['출발지'] === src &&
    d['기간']   === period &&
    d['요일']   === dayType(isHolidayServer, customHolidays, forceWeekend)
  );
  if (displayStop === '중앙역') rows = rows.filter(d => d['노선기호'] === '중앙역');
  if (displayStop === '셔틀콕 건너편') rows = rows.filter(d => d['행선지'] === '셔틀콕/인재원');

  const allMapped = rows
    .map(d => {
      const srcMin   = d['시'] * 60 + d['분'];
      const dOff     = depOffset(displayStop, d['노선기호']);
      const thisDepM = srcMin + dOff;
      const { label, min: aOff, subway } = arrivalInfo(displayStop, d['노선기호']);
      const thisArrM = thisDepM + aOff;
      return {
        depMin:   thisDepM,
        dep:      intToHHMM(Math.floor(thisDepM / 60), thisDepM % 60),
        arr:      intToHHMM(Math.floor(thisArrM / 60), thisArrM % 60),
        arrLabel: label,
        subway,
        route:    d['노선기호'],
      };
    })
    .sort((a, b) => a.depMin - b.depMin);

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
  } else if (filteredPast.length > 2) {
    filteredPast = filteredPast.slice(-2);
  }

  return filteredPast.concat(upcoming);
}

// 전체 시간표 계산 (순수 함수)
export function computeFullSchedule(allData, displayStop, dayTypeStr, appConfig = {}, overridePeriod = null) {
  const period = overridePeriod || appConfig.current_period || '학기중';
  const src = STOP_SOURCE[displayStop];
  const normalizedDayType = dayTypeStr === '주말/공휴일' ? '주말' : dayTypeStr;

  let rows = allData.filter(d =>
    d['출발지'] === src &&
    d['기간']   === period &&
    d['요일']   === normalizedDayType
  );
  if (displayStop === '중앙역') rows = rows.filter(d => d['노선기호'] === '중앙역');
  if (displayStop === '셔틀콕 건너편') rows = rows.filter(d => d['행선지'] === '셔틀콕/인재원');

  const allMapped = rows
    .map(d => {
      const srcMin   = d['시'] * 60 + d['분'];
      const dOff     = depOffset(displayStop, d['노선기호']);
      const thisDepM = srcMin + dOff;
      const { label, min: aOff, subway } = arrivalInfo(displayStop, d['노선기호']);
      const thisArrM = thisDepM + aOff;
      return {
        depMin:   thisDepM,
        dep:      intToHHMM(Math.floor(thisDepM / 60), thisDepM % 60),
        arr:      intToHHMM(Math.floor(thisArrM / 60), thisArrM % 60),
        arrLabel: label,
        subway,
        route:    d['노선기호'],
      };
    })
    .sort((a, b) => a.depMin - b.depMin);

  const lastMin = allMapped.length > 0 ? allMapped[allMapped.length - 1].depMin : -1;
  return allMapped.map(r => ({ ...r, isLast: r.depMin === lastMin }));
}

// 셔틀 도착 이후 연결 가능한 지하철 편 필터 (순수 함수)
export function connectingTrains(subwayArrivals, shuttleArrTime, lineId) {
  if (!subwayArrivals?.length) return [];
  const opt = SUBWAY_OPTS.find(o => o.id === lineId);
  if (!opt) return [];
  const arrM = toMin(shuttleArrTime);
  return subwayArrivals
    .filter(tr => tr.subwayId === opt.subwayId && tr.updnLine === opt.updnLine)
    .filter(tr => toMin(tr.arrTime) >= arrM)
    .slice(0, 2);
}
