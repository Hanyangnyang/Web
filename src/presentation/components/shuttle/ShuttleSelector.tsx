// 컴포넌트: 셔틀 기간/요일 선택기 (Wheel Picker 스타일)
import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ShuttleAppConfig } from '../../../domain/entities/Shuttle.js';

interface ShuttleSelectorProps {
  isFullMode: boolean;
  fullPeriod: string;
  setFullPeriod: (period: string) => void;
  fullDayType: string;
  setFullDayType: (dayType: string) => void;
  appConfig: ShuttleAppConfig;
  isHolidayServer: boolean | null;
  isWeekend: boolean;
}

export function ShuttleSelector({ isFullMode, fullPeriod, setFullPeriod, fullDayType, setFullDayType, appConfig, isHolidayServer, isWeekend }: ShuttleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [localPeriod, setLocalPeriod] = useState(fullPeriod);
  const [localDayType, setLocalDayType] = useState(fullDayType);

  const ref = useRef<HTMLDivElement>(null);
  const periodScrollRef = useRef<HTMLDivElement>(null);
  const dayTypeScrollRef = useRef<HTMLDivElement>(null);

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
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
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
        className={`${boxBase} cursor-pointer w-full px-2 gap-1.5 h-[44px] ${open ? 'border-primary shadow-[0_0_0_3px_rgba(14,74,132,0.2)]' : 'border-slate-200'}`}
        onClick={() => setOpen(p => !p)}
      >
        <div className="flex flex-col flex-1 min-w-0 items-center">
          <span className="text-[clamp(8px,2vw,9px)] font-bold text-text-hint tracking-[0.04em] uppercase whitespace-nowrap overflow-hidden text-ellipsis">{displayFullPeriod}</span>
          <span className="text-[clamp(12px,3vw,13px)] font-black text-text-main leading-tight whitespace-nowrap">{fullDayType === '평일' ? '평일' : '주말·공휴일'}</span>
        </div>
        <ChevronDown size={14} className={`text-text-hint transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-[190px] bg-white border border-slate-200 rounded-card shadow-[0_16px_40px_rgba(0,0,0,0.18)] overflow-hidden z-[200] [animation:sttDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
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
                const idx = Math.round(e.currentTarget.scrollTop / 36);
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
                const idx = Math.round(e.currentTarget.scrollTop / 36);
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
