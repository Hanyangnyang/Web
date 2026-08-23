// 컴포넌트: 셔틀 시간표 한 행 (출발/도착 시각, 연결 지하철)
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { ScheduleItem } from '../../../domain/entities/Shuttle.js';
import { SUBWAY_OPTS, connectingTrains, isSubwayOffPeak, type SubwayScheduleRow } from '../../../domain/entities/Subway.js';
import { LineBadge } from './LineBadge.jsx';
import styles from './TimetableRow.module.css';

const ROUTE_LABEL: Record<string, string> = {
  '순환': '순환',
  '직행': '직행',
  '예술인직행': '예술인\n직행',
  '중앙역': '중앙역',
  '아침직행': '직행',
  '아침예술인': '예술인\n직행',
};

// ── 노선 라벨 색상
const ROUTE_STYLE: Record<string, string> = {
  d: 'bg-[rgba(14,74,132,0.08)] text-primary',
  c: 'bg-[rgba(39,174,96,0.08)] text-success',
  dy: 'bg-[rgba(243,156,18,0.08)] text-warning-dark text-[9px] tracking-[-0.2px]',
  ja: 'bg-[rgba(253,224,71,0.2)] text-[#854d0e]',
};

// 시간표를 아직 못 받아왔을 때 실제 행과 같은 모양으로 자리를 채워두는 스켈레톤 (WeatherCard의 WeatherSkeleton과 동일한 패턴)
export function TimetableRowSkeleton({ hideSubwayCol }: { hideSubwayCol: boolean }) {
  return (
    <div className="flex items-stretch border-b border-slate-100 animate-pulse">
      <div className="flex items-center py-4 pl-4" style={{ flex: hideSubwayCol ? 1 : '0 0 52%' }}>
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-[58px] min-h-[34px] rounded bg-slate-200 flex-shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-6 w-[70px] bg-slate-200 rounded-lg" />
            <div className="h-3 w-24 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
      {!hideSubwayCol && (
        <div className="flex-1 flex items-center pr-3.5 pl-8">
          <div className="h-4 w-28 bg-slate-100 rounded-full" />
        </div>
      )}
    </div>
  );
}

interface TimetableRowProps {
  row: ScheduleItem & { isLast?: boolean };
  lineId: string;
  isNext: boolean;
  isLast: boolean;
  isPast: boolean;
  subwayArrivals: SubwayScheduleRow[];
  isSubwayLoading: boolean;
  hideSubwayCol: boolean;
  now: number;
  isFullMode: boolean;
  isActiveInFull: boolean;
  shouldScroll: boolean;
  autoFlip: boolean;
}

export function TimetableRow({ row, lineId, isNext, isLast, isPast, subwayArrivals, isSubwayLoading, hideSubwayCol, now, isFullMode, isActiveInFull, shouldScroll, autoFlip }: TimetableRowProps) {
  const [showRowRelative, setShowRowRelative] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  // lineId가 SUBWAY_OPTS에 없을 수 있음(예: 노선 개편 후 남은 오래된 localStorage 값) — 못 찾으면 첫 옵션으로 대체
  const opt = SUBWAY_OPTS.find(o => o.id === lineId) ?? SUBWAY_OPTS[0];
  const trains = row.subway ? connectingTrains(subwayArrivals, row.arr, lineId) : [];
  const noTrainReason = row.subway && trains.length === 0
    ? (isSubwayOffPeak(subwayArrivals, row.arr, lineId) ? '운행 시간 외' : '연결 열차 없음') : null;

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
        const element = elementRef.current!;

        // 1. 스크롤 가능한 가장 가까운 부모 요소를 찾습니다.
        const getScrollParent = (node: Node | null): Element | null => {
          if (node == null || !(node instanceof HTMLElement)) return null;
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
        let targetY: number;
        let startY: number;
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
        let startTime: number | null = null;

        const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
          t /= d / 2;
          if (t < 1) return c / 2 * t * t + b;
          t--;
          return -c / 2 * (t * (t - 2) - 1) + b;
        };

        const animateScroll = (timestamp: number) => {
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
      className={`flex items-stretch relative transition-all duration-300 select-none ${fullModeActiveStyle || 'border-b border-slate-100'} ${!isFullMode && isNext ? 'bg-white shadow-[inset_5px_0_0_0_#0E4A84] z-[20] cursor-pointer active:bg-slate-100' :
        !isFullMode && isPast ? 'opacity-55 bg-[#f8fafc] cursor-pointer active:bg-slate-100' :
          isFullMode ? 'bg-[#fafbfc]' : 'bg-[#fafbfc] cursor-pointer active:bg-slate-100'
        }`}
      onClick={() => {
        if (!isFullMode) setShowRowRelative(p => !p);
      }}
    >
      {isPast && !isFullMode && (
        <div className={`${tagBase} bg-slate-200 text-slate-500 px-2.5 h-5 flex items-center rounded-br`}>
          이전 셔틀{isLast && <span className="flex items-center justify-center bg-rose-400 text-white rounded-full w-[15px] h-[15px] flex-shrink-0 text-[9px] font-black ml-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">막</span>}
        </div>
      )}
      {isNext && !isFullMode && (
        <div className={`${tagBase} bg-primary px-2.5 h-5 flex items-center rounded-br`}>
          다음 셔틀{isLast && <span className="flex items-center justify-center bg-rose-400 text-white rounded-full w-[15px] h-[15px] flex-shrink-0 text-[9px] font-black ml-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">막</span>}
        </div>
      )}
      {isFullMode && isActiveInFull && (
        <div className={`${tagBase} bg-primary/95 px-2.5 h-5 flex items-center rounded-br shadow-sm`}>
          현재 시간대 위치
        </div>
      )}
      {isLast && !isNext && !isPast && !isFullMode && (
        <div className={`${tagBase} bg-rose-400 py-0.5 px-2.5 rounded-br`}>마지막 셔틀</div>
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
          <div className={`${styles.perspective} ${hideSubwayCol ? '' : 'flex-1'}`} style={{ height: 50, ...(hideSubwayCol && { width: 70 }) }}>
            <div className={`${styles.inner} ${(!isFullMode && showRowRelative) ? styles.flipped : ''}`}>
              {/* Front side (Absolute time) */}
              <div className={`${styles.front} flex flex-col justify-center`}>
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
              <div className={`${styles.back} flex flex-col justify-center`}>
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
                <Loader2 className="text-slate-300 animate-[spin_1s_linear_infinite]" size={16} />
              </div>
            ) : trains.length > 0 ? trains.map((tr, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <LineBadge opt={opt} size={20} />
                <span className="text-[13px] font-bold text-text-main whitespace-nowrap">{tr.dest}행</span>
                <span className="font-['Inter',-apple-system,sans-serif] text-[13px] font-bold text-text-sub whitespace-nowrap">
                  {tr.arrTime}
                </span>
              </div>
            )) : <span className="text-xs text-slate-300 font-medium">{noTrainReason}</span>
          ) : <span className="text-xs text-slate-300 font-medium">—</span>}
        </div>
      )}
    </div>
  );
}
