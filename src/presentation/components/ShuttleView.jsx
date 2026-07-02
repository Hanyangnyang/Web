// 컴포넌트: 셔틀버스 시간표 및 한대앞역 실시간 지하철 연결 정보 표시
import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, ChevronDown, ArrowUpRight, X, Star, MapPin, Bus, BusFront } from 'lucide-react';
import { STOPS, SUBWAY_OPTS, connectingTrains, toMin } from '../../domain/entities/Shuttle.js';
import { useShuttle } from '../hooks/useShuttle.js';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const ROUTE_LABEL = {
  '순환': '순환',
  '직행': '직행',
  '예술인직행': '예술인\n직행',
  '중앙역': '중앙역',
  '아침직행': '직행',
  '아침예술인': '예술인\n직행',
};

// ── 지하철 노선 뱃지
function LineBadge({ opt, size = 32 }) {
  const is4 = opt.line === '4호선';
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: opt.color }}>
      {is4
        ? <span className="font-['Inter',-apple-system,sans-serif] font-black text-white" style={{ fontSize: size * 0.5 }}>4</span>
        : <span className="font-black text-white text-center leading-[1.1]" style={{ fontSize: size * 0.22 }}>수인<br />분당</span>
      }
    </div>
  );
}



// ── 버스 정류소 드롭다운
function BusStopDropdown({ selected, onChange, activeStops, stops }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const OPTIONS = [
    { id: 'all', name: '전체 정류소' },
    ...stops.map(s => ({ id: s, name: s }))
  ];

  const currentOpt = OPTIONS.find(o => o.id === (selected[0] || 'all')) || OPTIONS[0];

  return (
    <div className="relative select-none text-[13px] font-semibold w-[115px]" ref={ref}>
      <div
        className={`flex items-center justify-between gap-1 px-3 py-[6px] bg-white border-[1.5px] rounded-card cursor-pointer transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-9 ${open ? 'border-primary shadow-[0_0_0_3px_rgba(14,74,132,0.15)]' : 'border-[#e2e8f0]'
          }`}
        onClick={() => setOpen(p => !p)}
      >
        <span className="flex-1 text-center text-text-main truncate">
          {currentOpt.name}
        </span>
        <ChevronDown size={14} className={`text-text-hint transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-[130px] bg-white border border-[#e2e8f0] rounded-card shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden z-[200] [animation:sttDropIn_0.15s_ease-out]">
          {OPTIONS.map(o => {
            const isActive = o.id === 'all' || activeStops.includes(o.id);
            return (
              <div
                key={o.id}
                className={`px-3 py-2 cursor-pointer transition-colors duration-100 text-center ${!isActive
                  ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                  : (selected[0] || 'all') === o.id
                    ? 'bg-[rgba(14,74,132,0.04)] text-primary font-semibold'
                    : 'text-text-sub hover:bg-surface'
                  }`}
                onClick={() => {
                  if (!isActive) return;
                  onChange(o.id === 'all' ? [] : [o.id]);
                  setOpen(false);
                }}
              >
                {o.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 지하철 노선 드롭다운
function SubwayDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opt = SUBWAY_OPTS.find(o => o.id === selected);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const line4 = SUBWAY_OPTS.filter(o => o.line === '4호선');
  const sb = SUBWAY_OPTS.filter(o => o.line === '수인분당선');

  return (
    <div className="relative select-none w-full min-w-0" ref={ref}>
      <div
        className={`flex items-center gap-2 px-[10px] py-[7px] pl-2 bg-white border-[1.5px] rounded-card cursor-pointer transition-all duration-150 shadow-[0_1px_4px_rgba(0,0,0,0.06)] w-full min-w-0 h-[44px] ${open ? 'border-primary shadow-[0_0_0_3px_rgba(14,74,132,0.2)]' : 'border-[#e2e8f0]'}`}
        onClick={() => setOpen(p => !p)}
      >
        <LineBadge opt={opt} size={28} />
        <div className="flex flex-col gap-px flex-1 min-w-0">
          <span className="text-[clamp(8px,2vw,9px)] font-bold text-text-hint tracking-[0.04em] whitespace-nowrap overflow-hidden text-ellipsis">{opt.line} · {opt.dir}</span>
          <span className="text-[clamp(12px,3vw,13px)] font-extrabold text-text-main whitespace-nowrap overflow-hidden text-ellipsis">{opt.dest}</span>
        </div>
        <svg
          className={`text-text-hint transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-[232px] bg-white border border-[#e2e8f0] rounded-card shadow-[0_16px_40px_rgba(0,0,0,0.14)] overflow-hidden z-[200] [animation:sttDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
          {[{ label: '4호선', items: line4 }, { label: '수인분당선', items: sb }].map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-[7px] px-3.5 pt-[9px] pb-1.5 text-[10px] font-bold text-text-hint tracking-[0.05em] border-t border-surface first:border-t-0">
                <LineBadge opt={items[0]} size={18} /><span>{label}</span>
              </div>
              {items.map(o => (
                <div
                  key={o.id}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-surface ${selected === o.id ? 'bg-[rgba(14,74,132,0.04)]' : ''}`}
                  onClick={() => { onChange(o.id); setOpen(false); }}
                >
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-text-main m-0">{o.dest}</p>
                    <p className="text-[11px] text-text-hint mt-0.5 mb-0">{o.dir} · 한대앞역 출발</p>
                  </div>
                  <div className={`w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${selected === o.id ? 'border-primary' : 'border-[#e2e8f0]'}`}>
                    {selected === o.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 노선 라벨 색상
const ROUTE_STYLE = {
  d: 'bg-[rgba(14,74,132,0.08)] text-primary',
  c: 'bg-[rgba(39,174,96,0.08)] text-success',
  dy: 'bg-[rgba(243,156,18,0.08)] text-warning-dark text-[9px] tracking-[-0.2px]',
  ja: 'bg-[rgba(253,224,71,0.2)] text-[#854d0e]',
};

// ── 시간표 행
function TimetableRow({ row, lineId, isNext, isLast, isPast, subwayArrivals, subwayOffPeak, isSubwayLoading, hideSubwayCol, now, isFullMode, isActiveInFull, shouldScroll, autoFlip }) {
  const [showRowRelative, setShowRowRelative] = useState(false);
  const elementRef = useRef(null);
  const opt = SUBWAY_OPTS.find(o => o.id === lineId);
  const trains = row.subway ? connectingTrains(subwayArrivals, row.arr, lineId) : [];
  const noTrainReason = row.subway && trains.length === 0
    ? (subwayOffPeak ? '운행 시간 외' : '연결 열차 없음') : null;

  const rLabel = ROUTE_LABEL[row.route] || row.route;
  const routeKey =
    row.route === '순환' ? 'c' :
      row.route === '예술인직행' || row.route === '아침예술인' ? 'dy' :
        row.route === '중앙역' ? 'ja' : 'd';

  const tagBase = "absolute top-0 left-0 text-[10px] font-black text-white z-[10]";

  // 상대 시간 계산 포맷터
  const getShuttleRelativeTime = () => {
    const diff = row.depMin - now;
    if (diff === 0) return '곧 출발';
    if (diff > 0) return `${diff}분 후`;
    return `${Math.abs(diff)}분 전`;
  };

  const getShuttleArrivalRelativeTime = () => {
    const arrMin = toMin(row.arr);
    const diff = arrMin - now;
    if (diff === 0) return '곧 도착';
    return diff > 0 ? `${diff}분 뒤 도착` : `${Math.abs(diff)}분 전 도착`;
  };

  // 첫 진입 시 다음 셔틀 자동 뒤집기 (1초 뒤, 남은 시간이 30분 이하일 때만)
  useEffect(() => {
    const diff = row.depMin - now;
    if (isNext && autoFlip && diff <= 30) {
      const timer = setTimeout(() => {
        setShowRowRelative(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isNext, autoFlip, row.depMin, now]);

  // 전체 시간표 전환 시 해당 위치로 부드러운 스크롤 (속도 1.5배 개선) + 시각효과
  useEffect(() => {
    if (isFullMode && isActiveInFull && shouldScroll && elementRef.current) {
      const timer = setTimeout(() => {
        const element = elementRef.current;

        // 1. 스크롤 가능한 가장 가까운 부모 요소를 찾습니다.
        const getScrollParent = (node) => {
          if (node == null) return null;
          if (node.scrollHeight > node.clientHeight) {
            const style = window.getComputedStyle(node);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              return node;
            }
          }
          return getScrollParent(node.parentNode) || document.documentElement || document.body;
        };

        const scrollParent = getScrollParent(element);
        if (!scrollParent) return;

        // 2. 부모 컨테이너 기준 타겟 스크롤 위치를 계산합니다.
        let targetY;
        let startY;
        if (scrollParent === document.documentElement || scrollParent === document.body) {
          targetY = element.getBoundingClientRect().top + window.scrollY - (window.innerHeight / 2) + (element.clientHeight / 2);
          startY = window.scrollY;
        } else {
          const parentRect = scrollParent.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          targetY = scrollParent.scrollTop + (elementRect.top - parentRect.top) - (parentRect.height / 2) + (element.clientHeight / 2);
          startY = scrollParent.scrollTop;
        }

        const distance = targetY - startY;
        const duration = 280; // 280ms 동안 빠르게 스크롤 (일반 smooth scroll 대비 약 1.5~2배 신속하게 이동)
        let startTime = null;

        const animateScroll = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = timestamp - startTime;
          const run = easeInOutQuad(progress, startY, distance, duration);

          if (scrollParent === document.documentElement || scrollParent === document.body) {
            window.scrollTo(0, run);
          } else {
            scrollParent.scrollTop = run;
          }

          if (progress < duration) {
            requestAnimationFrame(animateScroll);
          } else {
            if (scrollParent === document.documentElement || scrollParent === document.body) {
              window.scrollTo(0, targetY);
            } else {
              scrollParent.scrollTop = targetY;
            }
          }
        };

        const easeInOutQuad = (t, b, c, d) => {
          t /= d / 2;
          if (t < 1) return c / 2 * t * t + b;
          t--;
          return -c / 2 * (t * (t - 2) - 1) + b;
        };

        requestAnimationFrame(animateScroll);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isFullMode, isActiveInFull, shouldScroll]);

  // 전체 시간표 모드에서 현재 조회 시간대 노출 스타일 정의
  const fullModeActiveStyle = isFullMode && isActiveInFull
    ? 'bg-[rgba(14,74,132,0.05)] border-y-2 border-primary/20 shadow-[0_0_15px_rgba(14,74,132,0.08)] z-10 [animation:pulseHighlight_2s_infinite]'
    : '';

  return (
    <div
      ref={elementRef}
      className={`flex items-stretch border-b border-[#f1f5f9] relative transition-all duration-300 select-none ${fullModeActiveStyle} ${!isFullMode && isNext ? 'bg-white shadow-[inset_5px_0_0_0_#0E4A84] z-[20] cursor-pointer active:bg-slate-100' :
        !isFullMode && isPast ? 'opacity-55 bg-[#f8fafc] cursor-pointer active:bg-slate-100' :
          isFullMode ? 'bg-[#fafbfc]' : 'bg-[#fafbfc] cursor-pointer active:bg-slate-100'
        }`}
      onClick={() => {
        if (!isFullMode) setShowRowRelative(p => !p);
      }}
    >
      {isPast && !isFullMode && (
        <div className={`${tagBase} bg-[#e2e8f0] text-[#64748b] px-2.5 h-5 flex items-center rounded-br`}>
          이전 셔틀{isLast && <span className="flex items-center justify-center bg-[#fb7185] text-white rounded-full w-[15px] h-[15px] flex-shrink-0 text-[9px] font-black ml-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">막</span>}
        </div>
      )}
      {isNext && !isFullMode && (
        <div className={`${tagBase} bg-primary px-2.5 h-5 flex items-center rounded-br`}>
          다음 셔틀{isLast && <span className="flex items-center justify-center bg-[#fb7185] text-white rounded-full w-[15px] h-[15px] flex-shrink-0 text-[9px] font-black ml-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">막</span>}
        </div>
      )}
      {isFullMode && isActiveInFull && (
        <div className={`${tagBase} bg-primary/95 px-2.5 h-5 flex items-center rounded-br shadow-sm`}>
          현재 시간대 위치
        </div>
      )}
      {isLast && !isNext && !isPast && !isFullMode && (
        <div className={`${tagBase} bg-[#fb7185] py-0.5 px-2.5 rounded-br`}>마지막 셔틀</div>
      )}

      <div
        className="flex items-center py-4 pl-4"
        style={{
          paddingTop: (isNext || isLast || isPast || (isFullMode && isActiveInFull)) ? 26 : 16,
          flex: hideSubwayCol ? 1 : '0 0 52%',
        }}
      >
        <div className="flex items-center gap-3.5 w-full">
          <span className={`inline-flex justify-center items-center w-[58px] min-h-[34px] text-[10px] font-extrabold py-1 rounded flex-shrink-0 transition-all duration-200 whitespace-pre-line leading-[1.1] text-center ${ROUTE_STYLE[routeKey]}`}>
            {rLabel}
          </span>
          <div className={`perspective-container ${hideSubwayCol ? '' : 'flex-1'}`} style={{ height: 50, ...(hideSubwayCol && { width: 70 }) }}>
            <div className={`flip-card-inner ${(!isFullMode && showRowRelative) ? 'flipped' : ''}`}>
              {/* Front side (Absolute time) */}
              <div className="flip-card-front flex flex-col justify-center">
                <span className={`font-['Inter',-apple-system,sans-serif] text-[28px] font-black leading-none tracking-[-1px] ${isPast && !isFullMode ? 'text-text-hint' : 'text-text-main'}`}>
                  {row.dep}
                </span>
                <div className="flex items-center gap-[3px] mt-0.5">
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-hint)" strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span style={{ fontSize: 12, color: 'var(--color-text-hint)', fontWeight: 600 }} className="whitespace-nowrap">
                    {row.arrLabel} {row.arr}
                  </span>
                </div>
              </div>

              {/* Back side (Relative time) */}
              <div className="flip-card-back flex flex-col justify-center">
                <span className={`font-['Inter',-apple-system,sans-serif] text-[22px] font-black leading-none tracking-[-1px] ${isPast && !isFullMode ? 'text-text-hint' : 'text-text-main'}`}>
                  {getShuttleRelativeTime()}
                </span>
                <div className="flex items-center gap-[3px] mt-0.5">
                  <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="var(--color-text-hint)" strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span style={{ fontSize: 12, color: 'var(--color-text-hint)', fontWeight: 600 }} className="whitespace-nowrap">
                    {row.arrLabel} {row.arr}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hideSubwayCol && (
        <div
          className="flex-1 flex flex-col gap-0.5 justify-center pr-3.5 pl-8"
          style={{ paddingTop: (isNext || isLast || isPast || (isFullMode && isActiveInFull)) ? 26 : 14, paddingBottom: 14 }}
        >
          {row.subway ? (
            isSubwayLoading ? (
              <div className="flex items-center justify-start pl-0.5 h-6">
                <Loader2 className="text-[#cbd5e1] animate-[spin_1s_linear_infinite]" size={16} />
              </div>
            ) : trains.length > 0 ? trains.map((tr, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <LineBadge opt={opt} size={20} />
                <span className="text-[13px] font-bold text-text-main whitespace-nowrap">{tr.dest}행</span>
                <span className="font-['Inter',-apple-system,sans-serif] text-[13px] font-bold text-text-sub whitespace-nowrap">
                  {tr.arrTime}
                </span>
              </div>
            )) : <span className="text-xs text-[#cbd5e1] font-medium">{noTrainReason}</span>
          ) : <span className="text-xs text-[#cbd5e1] font-medium">—</span>}
        </div>
      )}
    </div>
  );
}

// ── 셔틀 기간/요일 선택기 (Wheel Picker 스타일)
function ShuttleSelector({ isFullMode, fullPeriod, setFullPeriod, fullDayType, setFullDayType, appConfig, isHolidayServer, isWeekend }) {
  const [open, setOpen] = useState(false);
  const [localPeriod, setLocalPeriod] = useState(fullPeriod);
  const [localDayType, setLocalDayType] = useState(fullDayType);

  const ref = useRef(null);
  const periodScrollRef = useRef(null);
  const dayTypeScrollRef = useRef(null);

  const periods = ['학기중', '계절학기', '방학중'];
  const dayTypes = ['평일', '주말/공휴일'];

  // 오픈 시 부모 상태로 로컬 상태 초기화
  useEffect(() => {
    if (open) {
      setLocalPeriod(fullPeriod);
      setLocalDayType(fullDayType);
    } else {
      // 닫힐 때 부모 상태에 반영 (Commit)
      setFullPeriod(localPeriod);
      setFullDayType(localDayType);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 오픈 시 스크롤 위치 초기화
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const pIdx = periods.indexOf(fullPeriod);
        const dIdx = dayTypes.findIndex(d => d === fullDayType || (fullDayType === '주말' && d === '주말/공휴일'));

        if (periodScrollRef.current && pIdx !== -1) {
          periodScrollRef.current.scrollTop = pIdx * 36;
        }
        if (dayTypeScrollRef.current && dIdx !== -1) {
          dayTypeScrollRef.current.scrollTop = dIdx * 36;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, fullPeriod, fullDayType]);

  // 공통 박스 스타일
  const boxBase = "flex items-center gap-2.5 px-3 py-[7px] bg-white border-[1.5px] rounded-card shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-150";

  if (!isFullMode) {
    const isWk = isHolidayServer || isWeekend;
    const dType = isWk ? '주말·공휴일' : '평일';
    const period = appConfig.current_period;
    const displayPeriod = period?.replace('중', ' 중');
    return (
      <div className={`${boxBase} border-primary/20 bg-primary/5 w-full px-2 gap-1.5 justify-center items-center h-[44px]`}>
        <div className="flex flex-col items-center">
          <span className="text-[clamp(8px,2vw,9px)] font-bold text-text-hint tracking-[0.04em] uppercase whitespace-nowrap">{displayPeriod}</span>
          <span className="text-[clamp(12px,3vw,13px)] font-black text-text-main leading-tight whitespace-nowrap">{dType}</span>
        </div>
      </div>
    );
  }

  const displayFullPeriod = fullPeriod?.replace('중', ' 중');

  return (
    <div className="relative select-none w-full" ref={ref}>
      <div
        className={`${boxBase} cursor-pointer w-full px-2 gap-1.5 h-[44px] ${open ? 'border-primary shadow-[0_0_0_3px_rgba(14,74,132,0.2)]' : 'border-[#e2e8f0]'}`}
        onClick={() => setOpen(p => !p)}
      >
        <div className="flex flex-col flex-1 min-w-0 items-center">
          <span className="text-[clamp(8px,2vw,9px)] font-bold text-text-hint tracking-[0.04em] uppercase whitespace-nowrap overflow-hidden text-ellipsis">{displayFullPeriod}</span>
          <span className="text-[clamp(12px,3vw,13px)] font-black text-text-main leading-tight whitespace-nowrap">{fullDayType === '평일' ? '평일' : '주말·공휴일'}</span>
        </div>
        <ChevronDown size={14} className={`text-text-hint transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-[190px] bg-white border border-[#e2e8f0] rounded-card shadow-[0_16px_40px_rgba(0,0,0,0.18)] overflow-hidden z-[200] [animation:sttDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="flex relative" style={{ height: 36 * 3, background: 'white' }}>
            {/* 선택 하이라이트 바 (알림 설정과 동일) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 6,
              right: 6,
              height: 36,
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.06)',
              borderRadius: 8,
              pointerEvents: 'none',
              zIndex: 10
            }} />

            {/* 기간 컬럼 */}
            <div
              ref={periodScrollRef}
              className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-0"
              onScroll={(e) => {
                const idx = Math.round(e.target.scrollTop / 36);
                if (periods[idx] && periods[idx] !== localPeriod) setLocalPeriod(periods[idx]);
              }}
            >
              <div style={{ height: 36 }} />
              {periods.map(p => (
                <div
                  key={p}
                  style={{
                    height: 36,
                    scrollSnapAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: localPeriod === p ? 700 : 400,
                    color: localPeriod === p ? '#1e293b' : '#d1d5db',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setLocalPeriod(p);
                    if (periodScrollRef.current) periodScrollRef.current.scrollTop = periods.indexOf(p) * 36;
                  }}
                >
                  {p.replace('중', ' 중')}
                </div>
              ))}
              <div style={{ height: 36 }} />
            </div>

            {/* 요일 컬럼 */}
            <div
              ref={dayTypeScrollRef}
              className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-0"
              onScroll={(e) => {
                const idx = Math.round(e.target.scrollTop / 36);
                if (dayTypes[idx] && dayTypes[idx] !== localDayType) setLocalDayType(dayTypes[idx]);
              }}
            >
              <div style={{ height: 36 }} />
              {dayTypes.map(d => {
                const isSelected = d === localDayType || (localDayType === '주말' && d === '주말/공휴일');
                return (
                  <div
                    key={d}
                    style={{
                      height: 36,
                      scrollSnapAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 400,
                      color: isSelected ? '#1e293b' : '#d1d5db',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setLocalDayType(d);
                      if (dayTypeScrollRef.current) dayTypeScrollRef.current.scrollTop = dayTypes.indexOf(d) * 36;
                    }}
                  >
                    {d}
                  </div>
                );
              })}
              <div style={{ height: 36 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트
export function ShuttleView({ isActive }) {
  const {
    stop, setStop,
    lineId, setLineId,
    schedule, nextIdx, now,
    subwayArrivals, subwayOffPeak,
    isHolidayServer, isWeekend,
    needsSubway,
    loadErr, isLoading, isSubwayLoading, isGpsLoading,
    visibleCount, loadMore,
    isFullMode, setIsFullMode,
    fullDayType, setFullDayType,
    fullPeriod, setFullPeriod,
    appConfig,
  } = useShuttle(isActive);

  const [triggerAutoFlip, setTriggerAutoFlip] = useState(false);
  const [viewMode, setViewMode] = useState('shuttle'); // 'shuttle' | 'bus'

  // Geolocation & GPS
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    if (viewMode === 'bus') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
          },
          (err) => console.log("GPS Error:", err),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  }, [viewMode]);



  const [selectedStops, setSelectedStops] = useState(() => {
    try {
      const saved = localStorage.getItem('public_bus_selected_stops');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('public_bus_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [expandedStops, setExpandedStops] = useState({});
  const [busArrivals, setBusArrivals] = useState({});
  const [isBusLoading, setIsBusLoading] = useState({});
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isUserActive, setIsUserActive] = useState(true);

  const busArrivalsRef = useRef({});
  useEffect(() => {
    busArrivalsRef.current = busArrivals;
  }, [busArrivals]);

  // 3분 미활동 사용자 감지 (절전 모드)
  useEffect(() => {
    if (viewMode !== 'bus') return;

    let timeoutId;
    const resetTimer = () => {
      setIsUserActive(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsUserActive(false);
      }, 3 * 60 * 1000); // 3 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => {
      document.addEventListener(name, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(name => {
        document.removeEventListener(name, resetTimer);
      });
    };
  }, [viewMode]);



  useEffect(() => {
    localStorage.setItem('public_bus_selected_stops', JSON.stringify(selectedStops));
  }, [selectedStops]);

  useEffect(() => {
    localStorage.setItem('public_bus_favorites', JSON.stringify(favorites));
  }, [favorites]);



  const DEFAULT_PRIORITY = [
    '셔틀콕',
    '기숙사',
    '융합교육관',
    '상록수역',
    '강남역우리은행',
    '의왕톨게이트'
  ];

  const STOP_COORDS = {
    '셔틀콕': { lat: 37.2989333, lon: 126.83775 },
    '기숙사': { lat: 37.2939833, lon: 126.83535 },
    '융합교육관': { lat: 37.2952667, lon: 126.8384667 },
    '상록수역': { lat: 37.3018167, lon: 126.8652167 },
    '강남역우리은행': { lat: 37.49575, lon: 127.02835 },
    '의왕톨게이트': { lat: 37.3485167, lon: 126.9845 }
  };

  // MOCK_ARRIVALS removed in favor of real-time API integration

  // Distance helper
  const getDistanceStr = (stopName) => {
    if (!userCoords) return null;
    const coord = STOP_COORDS[stopName];
    if (!coord) return null;

    const lat1 = userCoords.latitude;
    const lon1 = userCoords.longitude;
    const lat2 = coord.lat;
    const lon2 = coord.lon;

    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c; // in km

    if (dist < 1) {
      return `${Math.round(dist * 1000)}m`;
    }
    return `${dist.toFixed(1)}km`;
  };

  // Get closest stop name for badge
  const getClosestStopName = () => {
    if (!userCoords) return null;
    let minDistance = 999999;
    let closestStop = null;

    DEFAULT_PRIORITY.forEach(stopName => {
      const coord = STOP_COORDS[stopName];
      if (coord) {
        const lat1 = userCoords.latitude;
        const lon1 = userCoords.longitude;
        const lat2 = coord.lat;
        const lon2 = coord.lon;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const calcC = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * calcC;
        if (dist < minDistance) {
          minDistance = dist;
          closestStop = stopName;
        }
      }
    });

    return closestStop;
  };

  const closestStopName = getClosestStopName();

  // Get active stops (all priority stops are active by default since route filtering is removed)
  const activeStops = DEFAULT_PRIORITY;

  // Determine stop display ordering
  const getSortedStops = () => {
    const stopsList = [...DEFAULT_PRIORITY];

    const getStopScore = (stopName) => {
      const isFav = favorites.includes(stopName);
      const isActive = activeStops.includes(stopName);

      let dist = 999999;
      if (userCoords && STOP_COORDS[stopName]) {
        const c = STOP_COORDS[stopName];
        const lat1 = userCoords.latitude;
        const lon1 = userCoords.longitude;
        const dLat = (c.lat - lat1) * Math.PI / 180;
        const dLon = (c.lon - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const calcC = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        dist = 6371 * calcC;
      } else {
        dist = DEFAULT_PRIORITY.indexOf(stopName);
      }

      return { isFav, isActive, dist };
    };

    return stopsList.sort((a, b) => {
      const scoreA = getStopScore(a);
      const scoreB = getStopScore(b);

      if (scoreA.isFav !== scoreB.isFav) {
        return scoreA.isFav ? -1 : 1;
      }
      if (scoreA.isActive !== scoreB.isActive) {
        return scoreA.isActive ? -1 : 1;
      }
      return scoreA.dist - scoreB.dist;
    });
  };

  const sortedStops = getSortedStops();

  const hasInitializedCoordsRef = useRef(false);
  const prevViewModeRef = useRef(viewMode);
  const prevSelectedStopsRef = useRef(selectedStops);

  // Initialize expandedStops: top 2 for 'all' mode, or all selected stops for filtered mode
  useEffect(() => {
    if (viewMode === 'bus') {
      const viewModeChanged = prevViewModeRef.current !== viewMode;
      const selectedStopsChanged = JSON.stringify(prevSelectedStopsRef.current) !== JSON.stringify(selectedStops);
      const coordsJustLoaded = !hasInitializedCoordsRef.current && userCoords;

      prevViewModeRef.current = viewMode;
      prevSelectedStopsRef.current = selectedStops;

      if (viewModeChanged || selectedStopsChanged || coordsJustLoaded) {
        if (coordsJustLoaded) {
          hasInitializedCoordsRef.current = true;
        }

        if (selectedStops.length === 0) {
          // 전체 조회일 때: 가장 가까운 2개만 켬
          const top2 = sortedStops.slice(0, 2);
          const next = {};
          top2.forEach(s => {
            next[s] = true;
          });
          setExpandedStops(next);
        } else {
          // 특정 정류소 선택했을 때: 선택한 정류소들은 모두 펼침
          const next = {};
          selectedStops.forEach(s => {
            next[s] = true;
          });
          setExpandedStops(next);
        }
      }
    } else {
      // Reset flags when switching to shuttle view so it can re-initialize next time
      hasInitializedCoordsRef.current = false;
      prevViewModeRef.current = viewMode;
    }
  }, [viewMode, selectedStops, userCoords, sortedStops]);

  // (sortedStopChips removed as chips were replaced with a dropdown)

  const STATION_IDS = {
    '셔틀콕': '216000379',
    '기숙사': '216000383',
    '융합교육관': '216000381',
    '상록수역': '216000145',
    '강남역우리은행': '121000974',
    '의왕톨게이트': '226000038'
  };

  const ALLOWED_BUSES_BY_STOP = {
    '셔틀콕': ['3102', '10-1'],
    '기숙사': ['3102', '10-1'],
    '융합교육관': ['3102', '10-1'],
    '상록수역': ['3102', '10-1'],
    '강남역우리은행': ['3102'],
    '의왕톨게이트': ['3102', '3100', '8147']
  };

  const DEFAULT_DIRECTIONS = {
    '3102': {
      '셔틀콕': '강남역 방면',
      '기숙사': '강남역 방면',
      '융합교육관': '강남역 방면',
      '상록수역': '에리카 방면',
      '강남역우리은행': '에리카 방면',
      '의왕톨게이트': '에리카 방면'
    },
    '10-1': {
      '셔틀콕': '상록수역 방면',
      '기숙사': '상록수역 방면',
      '융합교육관': '상록수역 방면',
      '상록수역': '에리카 방면'
    },
    '3100': {
      '의왕톨게이트': '에리카 방면'
    },
    '8147': {
      '의왕톨게이트': '상록수역 방면'
    }
  };

  const fetchBusArrivalsForStop = useCallback(async (stopName) => {
    const stationId = STATION_IDS[stopName];
    if (!stationId) return;

    setIsBusLoading(prev => ({ ...prev, [stopName]: true }));
    try {
      const res = await fetch(`/api/bus?stationId=${stationId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      let list = data.response?.msgBody?.busArrivalList || [];
      if (!Array.isArray(list)) {
        list = [list];
      }

      const parsed = [];
      const allowed = ALLOWED_BUSES_BY_STOP[stopName] || [];

      // Get the existing arrivals for this stop to compare lastApiMinutes
      const prevList = busArrivalsRef.current[stopName] || [];

      const addArrival = (routeName, time, location, seatCount, crowded, dest, runIndex) => {
        if (time === undefined || time === null || time === '') return;

        const apiMinutes = parseInt(time, 10);
        if (isNaN(apiMinutes)) return;

        let seatInfo = '';
        if (seatCount !== undefined && seatCount !== -1 && seatCount !== '') {
          const seatNum = parseInt(seatCount, 10);
          if (!isNaN(seatNum) && seatNum > 0) seatInfo = `·${seatNum}석`;
        }

        let crowdedInfo = '';
        if (!seatInfo && crowded) {
          const crowdMap = { '1': '여유', '2': '보통', '3': '혼잡' };
          const label = crowdMap[String(crowded)];
          if (label) crowdedInfo = `·${label}`;
        }

        const locVal = parseInt(location, 10);
        const locStr = !isNaN(locVal) ? `${locVal}번째전` : '';

        // Match with previous arrival to apply smart sync
        const key = `${routeName}_${runIndex}`;
        const prevMatch = prevList.find(p => `${p.busId}_${p.runIndex}` === key);

        let seconds;
        if (prevMatch && prevMatch.lastApiMinutes === apiMinutes) {
          // Smart sync: if the API minutes are the same, preserve the current ticking seconds!
          seconds = prevMatch.seconds;
        } else {
          // Otherwise (first load or different minutes), initialize to minutes * 60 + 50 seconds
          seconds = apiMinutes * 60 + 50;
        }

        parsed.push({
          busId: routeName,
          runIndex,
          seconds,
          lastApiMinutes: apiMinutes,
          info: `${locStr}${seatInfo || crowdedInfo}`,
          direction: `${dest} 방면`
        });
      };

      for (const item of list) {
        const routeName = String(item.routeName);
        if (!allowed.includes(routeName)) continue;

        addArrival(routeName, item.predictTime1, item.locationNo1, item.remainSeatCnt1, item.crowded1, item.routeDestName, 0);
        addArrival(routeName, item.predictTime2, item.locationNo2, item.remainSeatCnt2, item.crowded2, item.routeDestName, 1);
      }

      setBusArrivals(prev => ({ ...prev, [stopName]: parsed }));
    } catch (e) {
      console.error(`Failed to fetch arrivals for ${stopName}:`, e);
    } finally {
      setIsBusLoading(prev => ({ ...prev, [stopName]: false }));
    }
  }, []);

  const prevExpandedStopsRef = useRef({});
  // Fetch immediately when stop transitions to expanded
  useEffect(() => {
    if (viewMode !== 'bus') {
      prevExpandedStopsRef.current = {};
      return;
    }

    const newlyExpandedStops = Object.keys(expandedStops).filter(
      stopName => expandedStops[stopName] === true && !prevExpandedStopsRef.current[stopName]
    );

    newlyExpandedStops.forEach(stopName => {
      fetchBusArrivalsForStop(stopName);
    });

    prevExpandedStopsRef.current = expandedStops;
  }, [viewMode, expandedStops, fetchBusArrivalsForStop]);

  // Detect tab/page visibility to prevent background API polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Periodic refresh (30s) - only active when page is visible and user is active
  useEffect(() => {
    if (viewMode !== 'bus' || !isPageVisible || !isUserActive) return;

    const fetchAll = () => {
      const expandedList = Object.keys(expandedStops).filter(k => expandedStops[k] === true);
      expandedList.forEach(stopName => {
        fetchBusArrivalsForStop(stopName);
      });
    };

    // Fetch immediately on visibility / activity activation
    fetchAll();

    const intervalId = setInterval(fetchAll, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [viewMode, expandedStops, fetchBusArrivalsForStop, isPageVisible, isUserActive]);

  // 1-second countdown timer for active arrivals
  useEffect(() => {
    if (viewMode !== 'bus' || !isPageVisible || !isUserActive) return;

    const timerId = setInterval(() => {
      setBusArrivals(prev => {
        const next = {};
        let changed = false;

        Object.keys(prev).forEach(stopName => {
          const list = prev[stopName];
          if (!list || list.length === 0) {
            next[stopName] = list;
            return;
          }

          const updatedList = list.map(item => {
            if (item.seconds > 0) {
              changed = true;
              return { ...item, seconds: item.seconds - 1 };
            }
            return item;
          });

          next[stopName] = updatedList;
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [viewMode, isPageVisible]);

  // 칩(출발지)을 바꿀 때마다 30분 이내의 다음 셔틀 자동 뒤집기 트리거 실행
  useEffect(() => {
    if (isActive && !isLoading && schedule.length > 0) {
      setTriggerAutoFlip(true);
      const t = setTimeout(() => setTriggerAutoFlip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isActive, isLoading, stop]);

  const [showTooltip, setShowTooltip] = useState(false);
  const [isTooltipFadingOut, setIsTooltipFadingOut] = useState(false);
  const [tooltipStop, setTooltipStop] = useState(stop);
  const [justToggledFullMode, setJustToggledFullMode] = useState(false);
  const [activeSubwayUrl, setActiveSubwayUrl] = useState(null);
  const [subwayRedirecting, setSubwayRedirecting] = useState(false);
  const hasInteractedRef = useRef(false);

  const HIDE_COL_STOPS = ['한대앞', '셔틀콕 건너편', '예술인', '중앙역'];
  const hideSubwayCol = HIDE_COL_STOPS.includes(stop);

  // 스크롤 동기화 만료 처리 효과
  useEffect(() => {
    if (justToggledFullMode) {
      const timer = setTimeout(() => setJustToggledFullMode(false), 500);
      return () => clearTimeout(timer);
    }
  }, [justToggledFullMode]);

  // 사용자가 외부 카카오 지도 이동 후 브라우저로 돌아왔을 때 스피너를 복구시킵니다.
  useEffect(() => {
    if (!subwayRedirecting) return;

    const handleFocus = () => setSubwayRedirecting(false);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [subwayRedirecting]);

  // 출발지 칩(stop) 이나 학기/요일 필터 변경 시 전체 시간표 스크롤을 맨 위(첫차)로 초기화
  const containerRef = useRef(null);
  useEffect(() => {
    if (isFullMode && containerRef.current) {
      const getScrollParent = (node) => {
        if (node == null) return null;
        if (node.scrollHeight > node.clientHeight) {
          const style = window.getComputedStyle(node);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return node;
          }
        }
        return getScrollParent(node.parentNode) || document.documentElement || document.body;
      };

      const scrollParent = getScrollParent(containerRef.current);
      if (scrollParent) {
        if (scrollParent === document.documentElement || scrollParent === document.body) {
          window.scrollTo(0, 0);
        } else {
          scrollParent.scrollTop = 0;
        }
      }
    }
  }, [stop, fullDayType, fullPeriod, lineId, isFullMode]);

  useEffect(() => {
    if (isGpsLoading) return;

    // 탭 전환 2초 후 띄우고, 8초 동안 유지 (총 10초 후 사라짐)
    const showTimer = setTimeout(() => {
      if (!hasInteractedRef.current) {
        setTooltipStop(stop); // 2초 뒤 툴팁 생성되는 찰나에 결정된 최신 자동선택 정류장으로 조립!
        setShowTooltip(true);
      }
    }, 2000);
    const hideTimer = setTimeout(() => {
      setIsTooltipFadingOut(true);
      setTimeout(() => setShowTooltip(false), 400);
    }, 10000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [stop, isGpsLoading]); // stop 이 비동기로 변할 때 타이머가 돌고 있다면 최신값을 잡을 수 있게 반영

  const handleStopClick = (s) => {
    setStop(s);
    if (showTooltip) {
      setIsTooltipFadingOut(true);
      setTimeout(() => setShowTooltip(false), 400);
    }
    hasInteractedRef.current = true;
  };

  return (
    <div className="relative min-h-full">
      {/* 셔틀 / 일반 세그먼트 컨트롤 */}
      <div className="sticky top-0 z-[200] bg-[#F8F9FA]/95 backdrop-blur-xl -mx-5 px-5 pt-3 pb-3 border-b border-[#e2e8f0]/50">
        <div className="text-[17px] font-bold text-text-main leading-tight mb-2">교통</div>
        <div className="relative flex bg-[#e8ecf0] p-[2.5px] rounded-full">
          <div
            className="absolute top-[2.5px] bottom-[2.5px] left-[2.5px] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              width: 'calc(50% - 2.5px)',
              transform: viewMode === 'shuttle' ? 'translateX(0)' : 'translateX(100%)',
              backgroundColor: viewMode === 'shuttle' ? '#0E4A84' : '#53B332'
            }}
          />
          <button
            onClick={() => setViewMode('shuttle')}
            className={`flex-1 py-2 text-[13px] font-black rounded-full transition-colors duration-300 relative z-10 ${viewMode === 'shuttle' ? 'text-white' : 'text-slate-500'}`}
          >
            학교 셔틀
          </button>
          <button
            onClick={() => setViewMode('bus')}
            className={`flex-1 py-2 text-[13px] font-black rounded-full transition-colors duration-300 relative z-10 ${viewMode === 'bus' ? 'text-white' : 'text-slate-500'}`}
          >
            공공 버스
          </button>
        </div>
      </div>

      {viewMode === 'shuttle' ? (
        loadErr ? (
          <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>{loadErr}</p></div></div>
        ) : isLoading ? (
          <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>불러오는 중…</p></div></div>
        ) : (
          <div className="pb-36 [animation:slideUp_0.4s_ease-out]">
            {/* 출발지 선택 (고정 상단) */}
            <div className="sticky top-[94px] bg-[#F8F9FA]/80 backdrop-blur-xl z-[100] -mx-5 px-5 pt-4 pb-4 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-6">
              <div className="flex items-center text-[17px] font-bold text-text-main mb-3">
                출발지
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {STOPS.map((s) => (
                  <div
                    key={s}
                    className={`flex-shrink-0 py-[7px] text-center flex items-center justify-center gap-1 border-[1.5px] rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative ${stop === s
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(14,74,132,0.22)]'
                      : 'border-[#e2e8f0] bg-white text-text-sub hover:bg-surface hover:border-[#cbd5e1]'
                      }`}
                    style={{ width: '7rem' }}
                    onClick={() => handleStopClick(s)}
                  >
                    {tooltipStop === s && showTooltip && (
                      <div
                        className={`stt-tooltip top absolute left-1/2 bg-[rgba(33,37,41,0.9)] text-white px-3.5 py-2.5 rounded-card text-[11px] font-bold whitespace-nowrap shadow-[0_12px_24px_-6px_rgba(0,0,0,0.3)] z-[500] flex items-center pointer-events-none backdrop-blur-sm transition-all duration-400 bottom-[calc(100%+12px)] ${isTooltipFadingOut ? 'opacity-0' : ''}`}
                        style={{ transform: `translateX(-50%) scale(0.85)${isTooltipFadingOut ? ' translateY(-0.5rem)' : ''}`, transformOrigin: 'bottom center', animation: 'tooltipPopSmall 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        잠깐! 이 출발지가 맞나요?
                      </div>
                    )}
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* 시간표 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-shrink-0 whitespace-nowrap flex items-center text-[17px] font-bold text-text-main">시간표</div>

                <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
                  <div className="shrink basis-[125px] min-w-0">
                    <ShuttleSelector
                      isFullMode={isFullMode}
                      fullPeriod={fullPeriod}
                      setFullPeriod={setFullPeriod}
                      fullDayType={fullDayType}
                      setFullDayType={setFullDayType}
                      appConfig={appConfig}
                      isHolidayServer={isHolidayServer}
                      isWeekend={isWeekend}
                    />
                  </div>
                  {needsSubway && (
                    <div className="shrink-0 min-w-0">
                      <SubwayDropdown selected={lineId} onChange={setLineId} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center py-0 pb-1.5 border-b border-[#f1f5f9]" style={{ gap: 'clamp(6px, 3vw, 16px)', paddingRight: 8 }}>
                <span className="text-[10px] font-bold text-[#cbd5e1] tracking-[0.04em] flex-shrink-0">
                  출발 시간
                </span>
                {!hideSubwayCol && (
                  needsSubway ? (
                    <button
                      onClick={async () => {
                        const is4Line = lineId.startsWith('line4-');
                        const cacheBuster = new Date().getTime();
                        let url = `https://place.map.kakao.com/${is4Line ? 'SES1755' : 'SES44M235'}?t=${cacheBuster}`;
                        if (Capacitor.isNativePlatform()) {
                          try {
                            const platform = Capacitor.getPlatform();
                            if (platform === 'android') {
                              await App.openUrl({ url });
                            } else {
                              await Browser.open({ url, presentationStyle: 'popover', toolbarColor: '#FFFFFF' });
                            }
                          } catch (err) {
                            window.open(url, '_blank');
                          }
                        } else {
                          setSubwayRedirecting(true);
                          setTimeout(() => { window.location.href = url; }, 1200);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: '#64748b',
                        letterSpacing: '0.01em',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginLeft: 'auto',
                      }}
                    >
                      카카오 지하철
                      <ArrowUpRight size={10} strokeWidth={2.2} />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-[#cbd5e1] tracking-[0.04em] flex-shrink-0" style={{ marginLeft: 'auto' }}>도착</span>
                  )
                )}
                <div className={`flex items-center gap-1.5 flex-shrink-0${hideSubwayCol ? ' ml-auto' : ''}`}>
                  <div
                    onClick={() => {
                      if (!isFullMode) setJustToggledFullMode(true);
                      setIsFullMode(!isFullMode);
                    }}
                    style={{ width: 38, height: 21, borderRadius: 20, padding: 2, cursor: 'pointer', background: isFullMode ? 'var(--color-primary)' : '#e0e0e0', position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)', flexShrink: 0 }}
                  >
                    <div style={{ width: 17, height: 17, borderRadius: '50%', background: 'white', boxShadow: '0 2px 3px rgba(0,0,0,0.15)', position: 'absolute', top: 2, left: isFullMode ? 19 : 2, transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: isFullMode ? 'var(--color-primary)' : 'var(--color-text-hint)', whiteSpace: 'nowrap' }}>
                    전체 시간표
                  </span>
                </div>
              </div>

              <div ref={containerRef} className="bg-white border border-[#e2e8f0] rounded-card overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
                {schedule.length > 0 ? (() => {
                  const fullActiveIdx = isFullMode ? schedule.findIndex(r => r.depMin >= now) : -1;
                  return (isFullMode ? schedule : schedule.slice(0, visibleCount)).map((row, i) => (
                    <TimetableRow
                      key={`${stop}-${i}`}
                      row={row}
                      lineId={lineId}
                      isNext={!isFullMode && i === nextIdx && nextIdx !== -1}
                      isLast={row.isLast || i === schedule.length - 1}
                      isPast={!isFullMode && row.depMin < now}
                      subwayArrivals={subwayArrivals}
                      subwayOffPeak={subwayOffPeak}
                      isSubwayLoading={isSubwayLoading}
                      hideSubwayCol={hideSubwayCol}
                      now={now}
                      isFullMode={isFullMode}
                      isActiveInFull={isFullMode && i === fullActiveIdx}
                      shouldScroll={justToggledFullMode}
                      autoFlip={triggerAutoFlip}
                    />
                  ));
                })() : (
                  <div className="min-h-[425px] flex flex-col justify-center py-8 text-center text-text-sub font-semibold">
                    <p>{isFullMode ? '운행 정보가 없습니다' : '오늘 남은 셔틀이 없습니다'}</p>
                  </div>
                )}
              </div>

              {!isFullMode && schedule.length > visibleCount && (
                <div className="flex justify-center py-4">
                  <button
                    className="bg-transparent border border-[#cbd5e1] text-text-sub rounded-full px-6 py-2 text-sm font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2 hover:bg-surface"
                    onClick={loadMore}
                  >
                    <ChevronDown size={16} />
                    더 불러오기
                  </button>
                </div>
              )}
            </div>

            {/* 실시간 지하철 정보 페이지 리다이렉팅 로딩 뷰 */}
            {subwayRedirecting && (
              <div
                className="fixed inset-0 bg-[rgba(15,23,42,0.78)] backdrop-blur-[6px] z-[10000] flex flex-col justify-center items-center gap-4 text-center select-none"
                style={{ animation: 'sttFadeIn 0.25s ease-out' }}
              >
                <div className="w-12 h-12 border-[3.5px] border-white/10 rounded-full border-t-primary animate-[spin_0.8s_linear_infinite] mb-2" />
                <p className="text-white text-[1.05rem] font-bold tracking-tight leading-snug whitespace-pre-line">
                  카카오 지하철로 이동할게요!
                </p>
                <p className="text-white/40 text-[0.78rem] font-medium tracking-wide">
                  잠시만 기다려 주세요
                </p>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="pb-36 [animation:slideUp_0.4s_ease-out]">
          {/* 고정 상단 필터 영역 */}
          <div className="sticky top-[94px] bg-[#F8F9FA]/80 backdrop-blur-xl z-[100] -mx-5 px-5 pt-4 pb-4 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-6">
            <div className="flex items-center justify-between gap-3 text-text-main">
              <span className="text-[17px] font-bold text-text-main">실시간 버스 정보</span>
              <BusStopDropdown
                selected={selectedStops}
                onChange={setSelectedStops}
                activeStops={activeStops}
                stops={DEFAULT_PRIORITY}
              />
            </div>
          </div>

          {/* 절전 모드 알림 배너 */}
          {!isUserActive && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-4 py-2.5 rounded-card text-center mb-3">
              데이터와 배터리 절약을 위해 실시간 업데이트를 일시 정지했습니다. 화면을 움직이거나 터치하면 재개합니다.
            </div>
          )}

          {/* 정류장별 버스 도착 정보 목록 */}
          <div className="space-y-3">
            {sortedStops
              .filter(stopName => {
                const passesBus = activeStops.includes(stopName);
                const matchesStopFilter = selectedStops.length === 0 || selectedStops.includes(stopName);
                return passesBus && matchesStopFilter;
              })
              .map(stopName => {
                const isExpanded = !!expandedStops[stopName];
                const isFav = favorites.includes(stopName);
                const arrivals = busArrivals[stopName] || [];
                const distanceStr = getDistanceStr(stopName);

                const filteredArrivals = arrivals;

                return (
                  <div key={stopName} className="bg-white border border-[#e2e8f0] rounded-card overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]">
                    {/* 아코디언 헤더 */}
                    <div
                      className="flex justify-between items-center px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors duration-150 select-none"
                      onClick={() => setExpandedStops(prev => ({ ...prev, [stopName]: !prev[stopName] }))}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* 즐겨찾기 별 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavorites(prev =>
                              prev.includes(stopName)
                                ? prev.filter(s => s !== stopName)
                                : [...prev, stopName]
                            );
                          }}
                          className="p-1 -ml-1 flex items-center justify-center cursor-pointer transition-transform duration-100 active:scale-75"
                        >
                          <Star
                            size={18}
                            fill={isFav ? '#fbbf24' : 'none'}
                            stroke={isFav ? '#fbbf24' : '#cbd5e1'}
                            strokeWidth={2}
                          />
                        </button>
                        <span className="font-bold text-[17px] tracking-tight text-text-main truncate">
                          {(() => {
                            const descMap = {
                              '기숙사': '기숙사 (한양대기숙사앞)',
                              '융합교육관': '융합교육관 (한국생산기술연구원)',
                              '셔틀콕': '셔틀콕 (한양대ERICA컨벤션센터)'
                            };
                            return descMap[stopName] || stopName;
                          })()}
                        </span>
                        <span className="text-[12px] font-medium text-text-sub ml-1 flex-shrink-0">
                          {(() => {
                            const dirMap = {
                              '의왕톨게이트': '에리카 방향',
                              '상록수역': '에리카 방향',
                              '셔틀콕': '강남역 방향',
                              '융합교육관': '강남역 방향',
                              '기숙사': '강남역 방향',
                              '강남역우리은행': '에리카 방향'
                            };
                            return dirMap[stopName] || '';
                          })()}
                        </span>
                        {closestStopName === stopName && (
                          <span className="text-[10px] font-extrabold text-[#27AE60] bg-[#27AE60]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                            가장 근처
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isBusLoading[stopName] && (
                          <Loader2 size={14} className="text-text-hint animate-spin" />
                        )}
                        <ChevronDown
                          size={18}
                          className={`text-[#94a3b8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>

                    {/* 아코디언 내용 */}
                    {isExpanded && (
                      <div className="border-t border-[#f1f5f9] bg-white">
                        {(() => {
                          const targetBuses = ALLOWED_BUSES_BY_STOP[stopName] || [];

                          if (targetBuses.length === 0) {
                            return (
                              <p className="text-center text-xs font-semibold text-text-hint py-4">
                                운행 정보가 없습니다.
                              </p>
                            );
                          }

                          return targetBuses.map((busId, idx) => {
                            const is3102 = busId === '3102';
                            const busArrivals = filteredArrivals.filter(arr => arr.busId === busId);
                            const firstArrival = busArrivals[0];
                            const secondArrival = busArrivals[1];
                            const directionLabel = (firstArrival && firstArrival.direction) || DEFAULT_DIRECTIONS[busId]?.[stopName] || '';
                            const isInitialLoading = isBusLoading[stopName] && (!busArrivals[stopName] || busArrivals[stopName].length === 0);

                            return (
                              <div key={busId}>
                                <div className="px-4 py-2 flex justify-between items-center">
                                  {/* 왼쪽 열: 버스번호 및 행선지 */}
                                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className="w-5 h-5 flex items-center justify-center rounded-[4px] flex-shrink-0"
                                        style={{ backgroundColor: (busId === '3102' || busId === '3100') ? '#EE2737' : busId === '8147' ? '#A2409F' : busId === '10-1' ? '#53B332' : '#94a3b8' }}
                                      >
                                        <BusFront
                                          size={12}
                                          className="text-white"
                                        />
                                      </div>
                                      <span
                                        className="text-[16px] font-bold text-[#334155]"
                                      >
                                        {busId}
                                      </span>
                                    </div>
                                    {isInitialLoading ? (
                                      <div className="w-24 h-3 bg-slate-100 rounded animate-pulse mt-1" />
                                    ) : (
                                      <span className="text-[12px] font-medium text-text-sub truncate">
                                        {directionLabel}
                                      </span>
                                    )}
                                  </div>

                                  {/* 오른쪽 열: 도착 정보 (첫 번째 & 두 번째) */}
                                  <div className="flex flex-col items-end gap-1.5 w-[190px] flex-shrink-0">
                                    {isInitialLoading ? (
                                      <div className="flex items-center justify-between w-full h-[26px] animate-pulse">
                                        <div className="w-[45px] h-[14px] bg-slate-200 rounded ml-auto mr-4" />
                                        <div className="w-[90px] h-[22px] bg-slate-100 rounded" />
                                      </div>
                                    ) : (
                                      <>
                                        {/* 첫 번째 도착 */}
                                        {firstArrival ? (() => {
                                          const parts = firstArrival.info ? firstArrival.info.split('·') : [];
                                          const beforeStr = parts[0] || '';
                                          const seatStr = parts[1] || '';

                                          // 10석 이하 또는 혼잡 여부 판단
                                          let isAlert = false;
                                          if (seatStr) {
                                            const match = seatStr.match(/(\d+)석/);
                                            if (match) {
                                              const seatNum = parseInt(match[1], 10);
                                              if (seatNum <= 10) {
                                                isAlert = true;
                                              }
                                            } else if (seatStr.includes('혼잡')) {
                                              isAlert = true;
                                            }
                                          }

                                          const isArrivingSoon = firstArrival.seconds < 60;
                                          const timeText = isArrivingSoon ? '잠시 후 도착' : `${Math.floor(firstArrival.seconds / 60)}분`;

                                          return (
                                            <div className="flex items-center justify-between w-full h-[26px]">
                                              <span className={`font-bold tracking-tight text-[#DE5B5B] w-[94px] text-right truncate ${isArrivingSoon ? 'text-[15px]' : 'text-[17px]'}`}>
                                                {timeText}
                                              </span>
                                              {firstArrival.info ? (
                                                <span className="text-[10px] font-bold text-text-sub bg-slate-100 px-1.5 py-0.5 rounded flex gap-1 justify-center w-[90px] shrink-0 whitespace-nowrap">
                                                  <span>{beforeStr}</span>
                                                  {seatStr && (
                                                    <span
                                                      className="font-extrabold"
                                                      style={{ color: isAlert ? '#DE5B5B' : '#3b82f6' }}
                                                    >
                                                      {seatStr}
                                                    </span>
                                                  )}
                                                </span>
                                              ) : (
                                                <div className="w-[90px] shrink-0" />
                                              )}
                                            </div>
                                          );
                                        })() : (
                                          <div className="flex items-center justify-end w-full h-[26px]">
                                            <span className="text-[11px] font-medium text-text-hint pr-1">도착정보 없음</span>
                                          </div>
                                        )}

                                        {/* 두 번째 도착 */}
                                        {secondArrival ? (() => {
                                          const parts = secondArrival.info ? secondArrival.info.split('·') : [];
                                          const beforeStr = parts[0] || '';
                                          const seatStr = parts[1] || '';

                                          // 10석 이하 또는 혼잡 여부 판단
                                          let isAlert = false;
                                          if (seatStr) {
                                            const match = seatStr.match(/(\d+)석/);
                                            if (match) {
                                              const seatNum = parseInt(match[1], 10);
                                              if (seatNum <= 10) {
                                                isAlert = true;
                                              }
                                            } else if (seatStr.includes('혼잡')) {
                                              isAlert = true;
                                            }
                                          }

                                          const isArrivingSoon = secondArrival.seconds < 60;
                                          const timeText = isArrivingSoon ? '잠시 후 도착' : `${Math.floor(secondArrival.seconds / 60)}분`;

                                          return (
                                            <div className="flex items-center justify-between w-full h-[26px]">
                                              <span className={`font-bold tracking-tight text-[#DE5B5B] w-[94px] text-right truncate ${isArrivingSoon ? 'text-[15px]' : 'text-[17px]'}`}>
                                                {timeText}
                                              </span>
                                              {secondArrival.info ? (
                                                <span className="text-[10px] font-bold text-text-sub bg-slate-100 px-1.5 py-0.5 rounded flex gap-1 justify-center w-[90px] shrink-0 whitespace-nowrap">
                                                  <span>{beforeStr}</span>
                                                  {seatStr && (
                                                    <span
                                                      className="font-extrabold"
                                                      style={{ color: isAlert ? '#DE5B5B' : '#3b82f6' }}
                                                    >
                                                      {seatStr}
                                                    </span>
                                                  )}
                                                </span>
                                              ) : (
                                                <div className="w-[90px] shrink-0" />
                                              )}
                                            </div>
                                          );
                                        })() : (
                                          <div className="flex items-center justify-end w-full h-[26px]">
                                            <span className="text-[11px] font-medium text-text-hint pr-1">도착정보 없음</span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                {idx < targetBuses.length - 1 && (
                                  <div className="mx-5 border-b border-dashed border-slate-200" />
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

    </div>
  );
}
