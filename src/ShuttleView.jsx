import { useState, useEffect, useRef, useCallback } from 'react';

// ── Period config ────────────────────────────────────────────────────────────
// Change this when the semester changes: '학기중' | '계절학기' | '방학중'
const CURRENT_PERIOD = '학기중';

// ── Stop definitions ─────────────────────────────────────────────────────────
const STOPS = ['기숙사', '셔틀콕', '한대앞', '셔틀콕 건너편', '예술인', '중앙역'];

// Which JSON 출발지 to query for each display stop
const STOP_SOURCE = {
  '기숙사': '창의인재원',
  '셔틀콕': '셔틀콕',
  '한대앞': '한대앞역',
  '예술인': '예술인APT',
  '셔틀콕 건너편': '한대앞역',  // derived — offset applied below
  '중앙역': '셔틀콕',    // derived — only 중앙역 route, offset applied below
};

// Minutes from the source stop's departure time to this display stop's "departure"
// (0 for direct stops; positive for derived stops where the shuttle passes through later)
function depOffset(displayStop, route) {
  if (displayStop === '셔틀콕 건너편') {
    if (route === '중앙역') return 6;   // 한대앞→중앙역(+3)→셔틀콕건너편(+3)
    if (route === 'D') return 10;   // 한대앞→셔틀콕건너편(+10) direct
    return 15;                         // C: 한대앞→예술인(+5)→셔틀콕건너편(+10)
  }
  if (displayStop === '중앙역') return 13; // 셔틀콕→한대앞(+10)→중앙역(+3)
  return 0;
}

// Minutes from this display stop's departure to the arrival destination,
// plus the label and whether subway connections apply.
function arrivalInfo(displayStop, route) {
  switch (displayStop) {
    case '기숙사':
      if (route === 'DY') return { label: '예술인', min: 15, subway: false };
      return { label: '한대앞역', min: 15, subway: true };
    case '셔틀콕':
      if (route === 'DY') return { label: '예술인', min: 10, subway: false };
      return { label: '한대앞역', min: 10, subway: true };
    case '한대앞':
      if (route === '중앙역') return { label: '학교', min: 6, subway: false };
      if (route === 'D') return { label: '학교', min: 10, subway: false };
      return { label: '학교', min: 15, subway: false };
    case '예술인':
      return { label: '학교', min: 10, subway: false };
    case '셔틀콕 건너편':
      return { label: '기숙사', min: 5, subway: false };
    case '중앙역':
      return { label: '학교', min: 3, subway: false };
    default:
      return { label: '도착', min: 15, subway: false };
  }
}

// ── Subway line options ───────────────────────────────────────────────────────
const OPTS = [
  { id: 'line4-bulam', line: '4호선', color: '#33AADF', dest: '불암산행', dir: '상행', shortDest: '불암산', subwayId: '1004', updnLine: '상행' },
  { id: 'line4-oido', line: '4호선', color: '#33AADF', dest: '오이도행', dir: '하행', shortDest: '오이도', subwayId: '1004', updnLine: '하행' },
  { id: 'sb-wang', line: '수인분당선', color: '#F5A623', dest: '왕십리행', dir: '상행', shortDest: '왕십리', subwayId: '1075', updnLine: '상행' },
  { id: 'sb-incheon', line: '수인분당선', color: '#F5A623', dest: '인천행', dir: '하행', shortDest: '인천', subwayId: '1075', updnLine: '하행' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const addMin = (t, n) => {
  const total = toMin(t) + n;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const curMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const dayType = (isHolidayServer) => {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
  const d = kst.getDay();
  if (isHolidayServer === true) return '주말';
  return (d === 0 || d === 6) ? '주말' : '평일';
};
const pad2 = (n) => String(n).padStart(2, '0');
const intToHHMM = (h, m) => `${pad2(h)}:${pad2(m)}`;

// ── Schedule computation ──────────────────────────────────────────────────────
function computeSchedule(allData, displayStop, nowMinutes, isHolidayServer) {
  const src = STOP_SOURCE[displayStop];
  let rows = allData.filter(d =>
    d['출발지'] === src &&
    d['기간'] === CURRENT_PERIOD &&
    d['요일'] === dayType(isHolidayServer)
  );

  // For 중앙역 display stop, only show the 중앙역-loop shuttles
  if (displayStop === '중앙역') {
    rows = rows.filter(d => d['노선기호'] === '중앙역');
  }

  const mappedAndSorted = rows
    .map(d => {
      const srcMin = d['시'] * 60 + d['분'];
      const dOff = depOffset(displayStop, d['노선기호']);
      const thisDepM = srcMin + dOff;
      const { label, min: aOff, subway } = arrivalInfo(displayStop, d['노선기호']);
      const thisArrM = thisDepM + aOff;
      return {
        depMin: thisDepM,
        dep: intToHHMM(Math.floor(thisDepM / 60), thisDepM % 60),
        arr: intToHHMM(Math.floor(thisArrM / 60), thisArrM % 60),
        arrLabel: label,
        subway,
        route: d['노선기호'],
      };
    })
    .sort((a, b) => a.depMin - b.depMin);

  const lastMin = mappedAndSorted.length > 0 ? mappedAndSorted[mappedAndSorted.length - 1].depMin : -1;

  return mappedAndSorted
    .map(r => ({ ...r, isLast: r.depMin === lastMin }))
    .filter(r => r.depMin >= nowMinutes)
    .slice(0, 5);
}

// Filter API arrivals to trains connecting after a shuttle's arrival time
function connectingTrains(subwayArrivals, shuttleArrTime, lineId) {
  if (!subwayArrivals?.length) return [];
  const opt = OPTS.find(o => o.id === lineId);
  if (!opt) return [];
  const arrM = toMin(shuttleArrTime);
  return subwayArrivals
    .filter(tr => tr.subwayId === opt.subwayId && tr.updnLine === opt.updnLine)
    .filter(tr => toMin(tr.arrTime) >= arrM)
    .slice(0, 2);
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const IcBed = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20V10h20v10M2 10V8a2 2 0 012-2h5a2 2 0 012 2v2M13 10V8a2 2 0 012-2h5a2 2 0 012 2v2" />
  </svg>
);
const IcSchool = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M3 10l9-7 9 7M5 21V10M19 21V10M9 21V15h6v6" />
  </svg>
);
const IcSubway = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="13" rx="3" />
    <path d="M4 10h16" />
    <circle cx="9" cy="16" r="2" />
    <circle cx="15" cy="16" r="2" />
  </svg>
);
const IcBus = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="13" rx="2" />
    <path d="M2 11h20" />
    <circle cx="7" cy="18" r="1.5" />
    <circle cx="17" cy="18" r="1.5" />
  </svg>
);

const STOP_ICON = {
  '기숙사': IcBed,
  '셔틀콕': IcSchool,
  '한대앞': IcSubway,
  '셔틀콕 건너편': IcSchool,
  '예술인': IcBus,
  '중앙역': IcSubway,
};

// ── LineBadge ─────────────────────────────────────────────────────────────────
function LineBadge({ opt, size = 32 }) {
  const is4 = opt.line === '4호선';
  return (
    <div className="stt-lb" style={{ width: size, height: size, background: opt.color }}>
      {is4
        ? <span className="stt-lb-4" style={{ fontSize: size * 0.5 }}>4</span>
        : <span className="stt-lb-sb" style={{ fontSize: size * 0.22 }}>수인<br />분당</span>
      }
    </div>
  );
}

// ── SubwayDropdown ────────────────────────────────────────────────────────────
function SubwayDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opt = OPTS.find(o => o.id === selected);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const line4 = OPTS.filter(o => o.line === '4호선');
  const sb = OPTS.filter(o => o.line === '수인분당선');

  return (
    <div className="stt-dd-wrap" ref={ref}>
      <div className={`stt-dd-trigger${open ? ' open' : ''}`} onClick={() => setOpen(p => !p)}>
        <LineBadge opt={opt} size={28} />
        <div className="stt-dd-trigger-text">
          <span className="stt-dd-trigger-line">{opt.line} · {opt.dir}</span>
          <span className="stt-dd-trigger-dest">{opt.dest}</span>
        </div>
        <svg className={`stt-dd-arrow${open ? ' open' : ''}`} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="stt-dd-panel">
          <div className="stt-dd-group-label">
            <LineBadge opt={line4[0]} size={18} />
            <span>4호선</span>
          </div>
          {line4.map(o => (
            <div key={o.id} className={`stt-dd-opt${selected === o.id ? ' sel' : ''}`}
              onClick={() => { onChange(o.id); setOpen(false); }}>
              <div className="stt-dd-opt-info">
                <p className="stt-dd-opt-main">{o.dest}</p>
                <p className="stt-dd-opt-sub">{o.dir} · 한대앞역 출발</p>
              </div>
              <div className={`stt-dd-radio${selected === o.id ? ' sel' : ''}`}>
                {selected === o.id && <div className="stt-dd-dot" />}
              </div>
            </div>
          ))}

          <div className="stt-dd-group-label">
            <LineBadge opt={sb[0]} size={18} />
            <span>수인분당선</span>
          </div>
          {sb.map(o => (
            <div key={o.id} className={`stt-dd-opt${selected === o.id ? ' sel' : ''}`}
              onClick={() => { onChange(o.id); setOpen(false); }}>
              <div className="stt-dd-opt-info">
                <p className="stt-dd-opt-main">{o.dest}</p>
                <p className="stt-dd-opt-sub">{o.dir} · 한대앞역 출발</p>
              </div>
              <div className={`stt-dd-radio${selected === o.id ? ' sel' : ''}`}>
                {selected === o.id && <div className="stt-dd-dot" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ROUTE_LABEL = {
  'DH': '직행',
  'D': '직행',
  'DY': '예술인\n직행',
  'C': '순환',
  '중앙역': '순환',
};

// ── TimetableRow ──────────────────────────────────────────────────────────────
function TimetableRow({ row, lineId, isNext, subwayArrivals, subwayOffPeak }) {
  const opt = OPTS.find(o => o.id === lineId);
  const past = row.depMin < curMin();
  const trains = row.subway ? connectingTrains(subwayArrivals, row.arr, lineId) : [];

  const showSubwaySection = row.subway;
  const noTrainReason = showSubwaySection && trains.length === 0
    ? (subwayOffPeak ? '운행 시간 외' : '연결 열차 없음')
    : null;

  const rLabel = ROUTE_LABEL[row.route] || row.route;
  const routeClass = row.route === 'DY' ? 'dy' : (row.route === 'C' || row.route === '중앙역' ? 'c' : 'd');

  return (
    <div className={`stt-trow${isNext ? ' next' : ''}`}>
      {past && <div className="stt-past-tag">이전 셔틀</div>}
      {isNext && <div className="stt-next-tag">다음 셔틀</div>}
      {row.isLast && <div className="stt-last-tag">마지막 셔틀</div>}

      <div className="stt-shuttle-col" style={{ paddingTop: (isNext || past) ? 26 : 16, flex: '0 0 52%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className={`stt-route-label ${routeClass}`}>{rLabel}</span>
          <div>
            <span className={`stt-time-big${past ? ' past' : ''}`}>{row.dep}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <svg width={9} height={9} viewBox="0 0 24 24" fill="none"
                stroke={past ? '#cbd5e1' : '#94a3b8'} strokeWidth={2.5} strokeLinecap="round"
                style={{ flexShrink: 0 }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                {row.arrLabel} {row.arr}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="stt-subway-col" style={{ paddingTop: isNext ? 26 : 14 }}>
        {showSubwaySection ? (
          trains.length > 0 ? trains.map((tr, i) => (
            <div key={i} className="stt-subway-row">
              <LineBadge opt={opt} size={20} />
              <span className="stt-subway-dest">{tr.dest}행</span>
              <span className="stt-subway-time">{tr.arrTime}</span>
            </div>
          )) : (
            <span className="stt-no-train">{noTrainReason}</span>
          )
        ) : (
          <span className="stt-no-train">—</span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ShuttleView() {
  const [stop, setStop] = useState(() => localStorage.getItem('shuttle_stop') || '기숙사');
  const [lineId, setLineId] = useState(() => localStorage.getItem('shuttle_lineId') || 'line4-bulam');
  const [allData, setAllData] = useState(null);
  const [subwayArrivals, setSubwayArrivals] = useState([]);
  const [subwayOffPeak, setSubwayOffPeak] = useState(false);
  const [isHolidayServer, setIsHolidayServer] = useState(null);
  const [now, setNow] = useState(curMin());
  const [loadErr, setLoadErr] = useState(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const [initialStop] = useState(stop);

  // Hide tooltip after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('shuttle_stop', stop);
  }, [stop]);

  useEffect(() => {
    localStorage.setItem('shuttle_lineId', lineId);
  }, [lineId]);

  // Load shuttle schedule once
  useEffect(() => {
    fetch('/shuttle.json')
      .then(r => r.json())
      .then(setAllData)
      .catch(() => setLoadErr('셔틀 시간표를 불러오지 못했습니다.'));
  }, []);

  // Keep "now" fresh every minute for next-shuttle highlight
  useEffect(() => {
    const id = setInterval(() => setNow(curMin()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch subway arrivals (only for stops that show subway info)
  const stopNeedsSubway = stop === '기숙사' || stop === '셔틀콕';
  const fetchSubway = useCallback(() => {
    fetch('/api/subway')
      .then(r => r.json())
      .then(d => {
        setSubwayArrivals(d.arrivals || []);
        setSubwayOffPeak(!!d.offPeak);
        setIsHolidayServer(d.isHoliday ?? false);
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!stopNeedsSubway) return;
    fetchSubway();
    const id = setInterval(fetchSubway, 2 * 60_000);
    return () => clearInterval(id);
  }, [stopNeedsSubway, fetchSubway]);

  if (loadErr) {
    return (
      <div className="stt-container">
        <div className="stt-empty"><p>{loadErr}</p></div>
      </div>
    );
  }

  if (!allData) {
    return (
      <div className="stt-container">
        <div className="stt-empty"><p>불러오는 중…</p></div>
      </div>
    );
  }

  const schedule = computeSchedule(allData, stop, now, isHolidayServer);
  // Index of the first upcoming shuttle (depMin >= now)
  const nextIdx = schedule.findIndex(r => r.depMin >= now);

  // Show subway dropdown only when the selected stop uses subway
  const showSubwayPicker = stop === '기숙사' || stop === '셔틀콕';

  return (
    <div className="stt-container">
      {/* Stop selector */}
      <div className="stt-section">
        <p className="stt-sec-label">출발지</p>
        <div className="stt-stops-grid">
          {STOPS.map((s, idx) => {
            const Icon = STOP_ICON[s];
            return (
              <div key={s} className={`stt-stop-chip${stop === s ? ' active' : ''}`} onClick={() => setStop(s)} style={{ position: 'relative' }}>
                {initialStop === s && showTooltip && (
                  <div className={`stt-tooltip ${idx >= 3 ? 'bottom' : 'top'}`}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    잠깐! 이 출발지가 맞나요?
                  </div>
                )}
                <Icon /> {s}
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable */}
      <div className="stt-section">
        <div className="stt-section-header">
          <p className="stt-sec-label">시간표</p>
          {showSubwayPicker && (
            <SubwayDropdown selected={lineId} onChange={setLineId} />
          )}
        </div>

        <div className="stt-col-header">
          <div className="stt-col-label" style={{ flex: '0 0 52%', paddingLeft: 90 }}>출발 시간</div>
          <div style={{ flex: 1, paddingLeft: 4 }} className="stt-col-label">
            {showSubwayPicker ? '연결 지하철' : '도착'}
          </div>
        </div>

        <div className="stt-tcard">
          {schedule.length > 0 ? (
            schedule.map((row, i) => (
              <TimetableRow
                key={i}
                row={row}
                lineId={lineId}
                isNext={i === nextIdx && nextIdx !== -1}
                subwayArrivals={subwayArrivals}
                subwayOffPeak={subwayOffPeak}
              />
            ))
          ) : (
            <div className="stt-empty"><p>오늘 남은 셔틀이 없습니다</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
