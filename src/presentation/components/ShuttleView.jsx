// 컴포넌트: 셔틀버스 시간표 및 한대앞역 실시간 지하철 연결 정보 표시
import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, ArrowUpRight, X, Star, MapPin, Bus, BusFront } from 'lucide-react';
import { STOPS, SUBWAY_OPTS, connectingTrains, toMin } from '../../domain/entities/Shuttle.js';
import { useShuttle } from '../hooks/useShuttle.js';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const ROUTE_LABEL = {
  '순환':     '순환',
  '직행':     '직행',
  '예술인직행': '예술인\n직행',
  '중앙역':   '중앙역',
  '아침직행':  '직행',
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

// ── 버스 노선 드롭다운
function BusDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const OPTIONS = [
    { id: 'all', name: '전체 노선' },
    { id: '3102', name: '3102' },
    { id: '10-1', name: '10-1' }
  ];

  const currentOpt = OPTIONS.find(o => o.id === (selected[0] || 'all'));

  return (
    <div className="relative select-none text-[13px] font-extrabold w-[105px]" ref={ref}>
      <div
        className={`flex items-center justify-between gap-1 px-3 py-[6px] bg-white border-[1.5px] rounded-card cursor-pointer transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-9 ${
          open ? 'border-primary shadow-[0_0_0_3px_rgba(14,74,132,0.15)]' : 'border-[#e2e8f0]'
        }`}
        onClick={() => setOpen(p => !p)}
      >
        <span className={`flex-1 text-center ${currentOpt.id === '3102' ? 'text-[#EE2737]' : currentOpt.id === '10-1' ? 'text-[#53B332]' : 'text-text-main'}`}>
          {currentOpt.name}
        </span>
        <ChevronDown size={14} className={`text-text-hint transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-full bg-white border border-[#e2e8f0] rounded-card shadow-[0_8px_24px_rgba(0,0,0,0.12)] overflow-hidden z-[200] [animation:sttDropIn_0.15s_ease-out]">
          {OPTIONS.map(o => (
            <div
              key={o.id}
              className={`px-3 py-2 cursor-pointer transition-colors duration-100 text-center hover:bg-surface ${
                (selected[0] || 'all') === o.id ? 'bg-[rgba(14,74,132,0.04)] text-primary font-extrabold' : 'text-text-sub'
              }`}
              onClick={() => {
                onChange(o.id === 'all' ? [] : [o.id]);
                setOpen(false);
              }}
            >
              {o.name}
            </div>
          ))}
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
    row.route === '순환'                              ? 'c'  :
    row.route === '예술인직행' || row.route === '아침예술인' ? 'dy' :
    row.route === '중앙역'                             ? 'ja' : 'd';

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

  // Public Bus States
  const [selectedBuses, setSelectedBuses] = useState(() => {
    try {
      const saved = localStorage.getItem('public_bus_selected_buses');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

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

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem('public_bus_selected_buses', JSON.stringify(selectedBuses));
  }, [selectedBuses]);

  useEffect(() => {
    localStorage.setItem('public_bus_selected_stops', JSON.stringify(selectedStops));
  }, [selectedStops]);

  useEffect(() => {
    localStorage.setItem('public_bus_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const BUSES = [
    { id: '3102', name: '3102', type: '광역', color: '#EE2737', stops: ['셔틀콕', '기숙사', '융합교육관', '상록수역', '의왕톨게이트', '강남역우리은행'], isPopular: true },
    { id: '10-1', name: '10-1', type: '시내', color: '#53B332', stops: ['셔틀콕', '기숙사', '융합교육관', '상록수역'] }
  ];

  const DEFAULT_PRIORITY = [
    '셔틀콕',
    '기숙사',
    '융합교육관',
    '상록수역',
    '강남역우리은행',
    '의왕톨게이트'
  ];

  const STOP_COORDS = {
    '셔틀콕': { lat: 37.2995, lon: 126.8379 },
    '기숙사': { lat: 37.2965, lon: 126.8345 },
    '융합교육관': { lat: 37.2985, lon: 126.8385 },
    '상록수역': { lat: 37.3023, lon: 126.8661 },
    '강남역우리은행': { lat: 37.4979, lon: 127.0276 },
    '의왕톨게이트': { lat: 37.3486, lon: 126.9698 }
  };

  const MOCK_ARRIVALS = {
    '셔틀콕': [
      { busId: '3102', time: '4분 16초', info: '2번째전·26석', direction: '강남역 방면' },
      { busId: '10-1', time: '2분 10초', info: '3번째전·여유', direction: '상록수역 방면' },
      { busId: '3102', time: '40분', info: '20번째전·39석', direction: '강남역 방면' }
    ],
    '기숙사': [
      { busId: '3102', time: '2분', info: '1번째전·15석', direction: '강남역 방면' },
      { busId: '10-1', time: '5분', info: '4번째전·보통', direction: '상록수역 방면' }
    ],
    '융합교육관': [
      { busId: '3102', time: '3분 20초', info: '2번째전·22석', direction: '강남역 방면' },
      { busId: '10-1', time: '1분', info: '1번째전·여유', direction: '상록수역 방면' }
    ],
    '상록수역': [
      { busId: '3102', time: '15분', info: '8번째전·빈자리많음', direction: '에리카 방면' },
      { busId: '10-1', time: '8분', info: '6번째전·보통', direction: '에리카 방면' }
    ],
    '강남역우리은행': [
      { busId: '3102', time: '25분', info: '회차 대기 중', direction: '에리카 방면' }
    ],
    '의왕톨게이트': [
      { busId: '3102', time: '12분', info: '5번째전·5석', direction: '에리카 방면' }
    ]
  };

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
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const calcC = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

  // Get active stops based on selected buses
  const activeStops = selectedBuses.length === 0
    ? DEFAULT_PRIORITY
    : Array.from(new Set(
        BUSES.filter(b => selectedBuses.includes(b.id))
             .flatMap(b => b.stops)
      ));

  // Auto clean selectedStops if they become inactive
  useEffect(() => {
    if (selectedBuses.length > 0) {
      setSelectedStops(prev => prev.filter(s => activeStops.includes(s)));
    }
  }, [selectedBuses]);

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
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const calcC = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

  // Initialize expandedStops for top 2
  useEffect(() => {
    if (viewMode === 'bus') {
      const top2 = sortedStops.slice(0, 2);
      setExpandedStops(prev => {
        const next = { ...prev };
        top2.forEach(s => {
          if (next[s] === undefined) next[s] = true;
        });
        return next;
      });
    }
  }, [viewMode, userCoords, favorites, selectedBuses]);

  // Sort stop chips: active ones at the front
  const sortedStopChips = [...DEFAULT_PRIORITY].sort((a, b) => {
    const aActive = activeStops.includes(a);
    const bActive = activeStops.includes(b);
    if (aActive !== bActive) {
      return aActive ? -1 : 1;
    }
    return DEFAULT_PRIORITY.indexOf(a) - DEFAULT_PRIORITY.indexOf(b);
  });

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
      {viewMode === 'shuttle' ? (
        loadErr ? (
          <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>{loadErr}</p></div></div>
        ) : isLoading ? (
          <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>불러오는 중…</p></div></div>
        ) : (
          <div className="pb-20 [animation:slideUp_0.4s_ease-out]">
            {/* 출발지 선택 (고정 상단) */}
            <div className="sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-xl z-[100] -mx-5 px-5 pt-4 pb-4 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-6">
              <div className="flex items-center text-2xl font-extrabold text-text-main mb-3">
                출발지
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STOPS.map((s, idx) => (
                  <div
                    key={s}
                    className={`py-[7px] px-2 text-center flex items-center justify-center gap-1 border-[1.5px] rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative ${stop === s
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(14,74,132,0.22)]'
                      : 'border-[#e2e8f0] bg-white text-text-sub hover:bg-surface hover:border-[#cbd5e1]'
                      }`}
                    onClick={() => handleStopClick(s)}
                    style={{ position: 'relative' }}
                  >
                    {tooltipStop === s && showTooltip && (() => {
                      const isTop = idx < 3;
                      const arrowClass = isTop ? 'top' : 'bottom';
                      const posClass = isTop ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]';
                      const anim = isTop ? 'tooltipPopSmall' : 'tooltipPopDownSmall';
                      const fadeY = isTooltipFadingOut ? (isTop ? ' translateY(-0.5rem)' : ' translateY(0.5rem)') : '';
                      const origin = isTop ? 'bottom center' : 'top center';
                      return (
                        <div
                          className={`stt-tooltip ${arrowClass} absolute left-1/2 bg-[rgba(33,37,41,0.9)] text-white px-3.5 py-2.5 rounded-card text-[11px] font-bold whitespace-nowrap shadow-[0_12px_24px_-6px_rgba(0,0,0,0.3)] z-[500] flex items-center pointer-events-none backdrop-blur-sm transition-all duration-400 ${isTooltipFadingOut ? 'opacity-0' : ''} ${posClass}`}
                          style={{ transform: `translateX(-50%) scale(0.85)${fadeY}`, transformOrigin: origin, animation: `${anim} 0.4s cubic-bezier(0.175,0.885,0.32,1.275)` }}
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          잠깐! 이 출발지가 맞나요?
                        </div>
                      );
                    })()}
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* 시간표 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-shrink-0 whitespace-nowrap flex items-center text-2xl font-extrabold text-text-main">시간표</div>

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

              <div className="flex items-center py-0 pb-1.5 border-b border-[#f1f5f9]" style={{ gap: 'clamp(6px, 3vw, 16px)', paddingRight: 8}}>
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
        <div className="pb-24 [animation:slideUp_0.4s_ease-out]">
          {/* 고정 상단 필터 영역 */}
          <div className="sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-xl z-[100] -mx-5 px-5 pt-4 pb-4 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] mb-6">
            {/* 정류장 선택 필터 헤더 (오른쪽에 버스 노선 드롭다운) */}
            <div className="flex items-center justify-between text-2xl font-extrabold text-text-main mb-3">
              <span>정류소</span>
              <BusDropdown selected={selectedBuses} onChange={setSelectedBuses} />
            </div>
            
            {/* 정류장 선택 필터 칩 리스트 */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-3.5 -my-3.5 -mx-5 px-5">
              {/* 전체 선택 칩 */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setSelectedStops([])}
                  className={`py-[7px] px-4 text-center flex items-center justify-center gap-1 border-[1.5px] rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${
                    selectedStops.length === 0
                      ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(14,74,132,0.22)]'
                      : 'border-[#e2e8f0] bg-white text-text-sub hover:bg-surface hover:border-[#cbd5e1]'
                  }`}
                >
                  전체
                </button>
              </div>

              {sortedStopChips.map(stopName => {
                const isActive = activeStops.includes(stopName);
                const isSelected = selectedStops.includes(stopName);
                return (
                  <div key={stopName} className="flex-shrink-0">
                    <button
                      disabled={!isActive}
                      onClick={() => {
                        setSelectedStops(prev => 
                          prev.includes(stopName)
                            ? prev.filter(s => s !== stopName)
                            : [...prev, stopName]
                        );
                      }}
                      className={`py-[7px] px-4 text-center flex items-center justify-center gap-1 border-[1.5px] rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${
                        !isActive
                          ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-50'
                          : isSelected
                            ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(14,74,132,0.22)]'
                            : 'border-[#e2e8f0] bg-white text-text-sub hover:bg-surface hover:border-[#cbd5e1]'
                      }`}
                    >
                      {stopName}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

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
                const arrivals = MOCK_ARRIVALS[stopName] || [];
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
                        <span className="font-extrabold text-[15px] text-text-main truncate">
                          {(() => {
                            const descMap = {
                              '기숙사': '기숙사 (한양대기숙사앞)',
                              '융합교육관': '융합교육관 (한국생산기술연구원)',
                              '셔틀콕': '셔틀콕 (한양대ERICA컨벤션센터)'
                            };
                            return descMap[stopName] || stopName;
                          })()}
                        </span>
                        {closestStopName === stopName && (
                          <span className="text-[10px] font-extrabold text-[#27AE60] bg-[#27AE60]/10 px-1.5 py-0.5 rounded flex-shrink-0">
                            가장 근처
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ChevronDown 
                          size={18} 
                          className={`text-[#94a3b8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                    
                      {/* 아코디언 내용 */}
                      {isExpanded && (
                        <div className="border-t border-[#f1f5f9] bg-white divide-y divide-[#f1f5f9]">
                          {filteredArrivals.length > 0 ? (() => {
                            const uniqueBusIds = Array.from(new Set(filteredArrivals.map(arr => arr.busId)));
                            return uniqueBusIds.map(busId => {
                              const is3102 = busId === '3102';
                              const busArrivals = filteredArrivals.filter(arr => arr.busId === busId);
                              const firstArrival = busArrivals[0];
                              const secondArrival = busArrivals[1];
                              return (
                                <div key={busId} className="px-4 py-3 flex justify-between items-center">
                                  {/* 왼쪽 열: 버스번호 및 행선지 */}
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <div 
                                        className="w-5 h-5 flex items-center justify-center rounded-[4px] flex-shrink-0"
                                        style={{ backgroundColor: busId === '3102' ? '#EE2737' : busId === '10-1' ? '#53B332' : '#94a3b8' }}
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
                                    <span className="text-[12px] font-medium text-text-sub">
                                      {firstArrival ? firstArrival.direction : ''}
                                    </span>
                                  </div>
                                  
                                  {/* 오른쪽 열: 도착 정보 (첫 번째 & 두 번째) */}
                                  <div className="flex flex-col items-end gap-1.5">
                                    {/* 첫 번째 도착 */}
                                    {firstArrival ? (() => {
                                      const parts = firstArrival.info ? firstArrival.info.split('·') : [];
                                      const beforeStr = parts[0] || '';
                                      const seatStr = parts[1] || '';
                                      
                                      // 10석 이하 여부 판단
                                      let isLowSeats = false;
                                      if (seatStr) {
                                        const match = seatStr.match(/(\d+)석/);
                                        if (match) {
                                          const seatNum = parseInt(match[1], 10);
                                          if (seatNum <= 10) {
                                            isLowSeats = true;
                                          }
                                        }
                                      }

                                      return (
                                        <div className="flex items-center gap-1.5 text-right">
                                          <span className="text-[14px] font-semibold text-[#EE2737]">
                                            {firstArrival.time}
                                          </span>
                                          {firstArrival.info && (
                                            <span className="text-[10px] font-bold text-text-sub bg-slate-100 px-1.5 py-0.5 rounded flex gap-1">
                                              <span>{beforeStr}</span>
                                              {seatStr && (
                                                <span 
                                                  className="font-extrabold"
                                                  style={{ color: isLowSeats ? '#EE2737' : '#3b82f6' }}
                                                >
                                                  {seatStr}
                                                </span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })() : (
                                      <span className="text-[12px] font-semibold text-text-hint">정보 없음</span>
                                    )}
                                    
                                    {/* 두 번째 도착 */}
                                    {secondArrival ? (() => {
                                      const parts = secondArrival.info ? secondArrival.info.split('·') : [];
                                      const beforeStr = parts[0] || '';
                                      const seatStr = parts[1] || '';

                                      // 10석 이하 여부 판단
                                      let isLowSeats = false;
                                      if (seatStr) {
                                        const match = seatStr.match(/(\d+)석/);
                                        if (match) {
                                          const seatNum = parseInt(match[1], 10);
                                          if (seatNum <= 10) {
                                            isLowSeats = true;
                                          }
                                        }
                                      }

                                      return (
                                        <div className="flex items-center gap-1.5 text-right">
                                          <span className="text-[14px] font-semibold text-[#EE2737]">
                                            {secondArrival.time}
                                          </span>
                                          {secondArrival.info && (
                                            <span className="text-[10px] font-bold text-text-sub bg-slate-100 px-1.5 py-0.5 rounded flex gap-1">
                                              <span>{beforeStr}</span>
                                              {seatStr && (
                                                <span 
                                                  className="font-extrabold"
                                                  style={{ color: isLowSeats ? '#EE2737' : '#3b82f6' }}
                                                >
                                                  {seatStr}
                                                </span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })() : (
                                      <span className="text-[11px] font-medium text-text-hint">-</span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })() : (
                            <p className="text-center text-xs font-semibold text-text-hint py-4">
                              운행 정보가 없습니다.
                            </p>
                          )}
                        </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div 
        className="fixed left-0 right-0 max-w-app mx-auto px-6 pointer-events-none z-[999] flex justify-end"
        style={{ bottom: 'calc(108px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div 
          className="pointer-events-auto w-14 h-14 cursor-pointer select-none"
          style={{ perspective: '1000px' }}
          onClick={() => setViewMode(prev => prev === 'shuttle' ? 'bus' : 'shuttle')}
        >
          <div 
            className="w-full h-full relative transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: viewMode === 'bus' ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* 앞면: 셔틀 상태일 때 보이는 면 */}
            <div 
              className="absolute inset-0 w-full h-full rounded-full flex flex-col items-center justify-center text-white shadow-[0_8px_16px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95 transition-transform duration-200"
              style={{ 
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              }}
            >
              <span className="text-[12px] font-bold tracking-wider leading-[1.3] text-center">
                셔틀<br />버스
              </span>
            </div>

            {/* 뒷면: 버스 상태일 때 보이는 면 */}
            <div 
              className="absolute inset-0 w-full h-full rounded-full flex flex-col items-center justify-center text-white shadow-[0_8px_16px_rgba(83,179,50,0.25)] hover:scale-105 active:scale-95 transition-transform duration-200"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(135deg, #53B332 0%, #449729 100%)',
              }}
            >
              <span className="text-[12px] font-bold tracking-wider leading-[1.3] text-center">
                노선<br />버스
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
