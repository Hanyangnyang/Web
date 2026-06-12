// 컴포넌트: 셔틀버스 시간표 및 한대앞역 실시간 지하철 연결 정보 표시
import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, ArrowUpRight, X } from 'lucide-react';
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

  if (loadErr) return <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>{loadErr}</p></div></div>;
  if (isLoading) return <div className="pb-20"><div className="py-8 text-center text-text-sub font-semibold"><p>불러오는 중…</p></div></div>;

  return (
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
  );
}
