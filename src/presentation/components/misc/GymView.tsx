// 컴포넌트: 체대 헬스장 수업 시간표 캘린더 (현재 시간 인디케이터 포함)
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useGymSchedule } from '../../hooks/useGymSchedule.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { NoticeBanner } from '../ui/NoticeBanner.jsx';
import { getKSTDateKey, getKSTNow } from '../../../utils/kstTime.js';
import { buildScheduleGrid, getMergedSchedule } from './gymScheduleFormat.js';
import type { GymScheduleCell } from './gymScheduleFormat.js';
import type { GymPeriod } from '../../../domain/entities/Gym.js';
import { ErrorBoundary } from '../common/ErrorBoundary.js';
import { CardFallback } from '../common/CardFallback.js';
import styles from './GymView.module.css';

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' },
  green:  { bg: '#F7FEE7', text: '#4D7C0F', border: '#ECFCCB' },
  blue:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  red:    { bg: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' },
  purple: { bg: '#FAF5FF', text: '#7E22CE', border: '#F3E8FF' },
  pink:   { bg: '#FDF2F8', text: '#BE185D', border: '#FCE7F3' },
  amber:  { bg: '#FFFBEB', text: '#B45309', border: '#FEF3C7' },
  sky:    { bg: '#F0F9FF', text: '#0369A1', border: '#E0F2FE' },
  indigo: { bg: '#EEF2FF', text: '#4338CA', border: '#E0E7FF' },
};
const CELL_COLOR_KEYS = Object.keys(COLORS);

function CourseName({ name }: { name: string }) {
  return (
    <div className={`${styles.courseName} text-[0.6rem] font-extrabold leading-[1.1] overflow-hidden w-full text-center flex flex-col items-center`}>
      {name.split(/[\n ]+/).map((line, i) => (
        <span key={i} className="course-name-line block">{line}</span>
      ))}
    </div>
  );
}

function GymScheduleSkeleton() {
  const ROWS = 12;
  return (
    <div className="bg-white rounded-card border border-slate-200 overflow-hidden animate-pulse">
      <div className="flex items-center py-3 px-1 border-b border-slate-200">
        <div style={{ width: '12%' }} />
        {['월', '화', '수', '목', '금'].map((_, i) => (
          <div key={i} className="flex justify-center" style={{ width: '17.6%' }}>
            <div className="h-3 w-4 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex m-3" style={{ height: '456px' }}>
        <div className="flex flex-col items-center justify-between py-1" style={{ width: '10%' }}>
          {Array.from({ length: ROWS }).map((_, i) => (
            <div key={i} className="h-3 w-4 bg-slate-100 rounded-full" />
          ))}
        </div>
        <div className="flex-1 rounded bg-slate-100" />
      </div>
    </div>
  );
}

interface GymViewProps {
  onBack: () => void;
}

export function GymView({ onBack }: GymViewProps) {
  useBackHandler(onBack);
  const { gymData, loadErr, refetch } = useGymSchedule();
  const [activePeriodId, setActivePeriodId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(getKSTNow);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // 데이터 도착 후, 오늘 날짜 기준 현재 기간 최초 1회 자동 판별
  useEffect(() => {
    if (!gymData || activePeriodId) return;
    const todayStr = getKSTDateKey();
    const matched = gymData.periods.find(p => p.startDate <= todayStr && todayStr <= p.endDate);
    const fallback = gymData.periods.find(p => p.periodType === 'semester') ?? gymData.periods[0];
    setActivePeriodId(matched ? matched.id : (fallback?.id ?? null));
  }, [gymData, activePeriodId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getKSTNow()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentPeriod: GymPeriod | null = gymData
    ? (gymData.periods.find(p => p.id === activePeriodId) || gymData.periods[0])
    : null;

  const openHour = currentPeriod ? parseInt(currentPeriod.openTime.split(':')[0], 10) : 0;
  const closeHour = currentPeriod ? parseInt(currentPeriod.closeTime.split(':')[0], 10) : 0;
  const closingHour = currentPeriod ? closeHour : null;

  const baseSchedule = React.useMemo(
    () => (currentPeriod ? buildScheduleGrid(currentPeriod.classes, openHour, closeHour, CELL_COLOR_KEYS) : []),
    [currentPeriod, openHour, closeHour]
  );
  const schedule = React.useMemo(() => getMergedSchedule(baseSchedule), [baseSchedule]);

  // 현재 시각이 표에서 몇 번째 행·요일 칸 위치(top px)에 해당하는지 계산 (주말이면 null)
  const getNowPos = (): { top: number; dayIndex: number } | null => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const day = currentTime.getDay();
    if (day === 0 || day === 6) return null;
    const rowIndex = baseSchedule.findIndex(s => s.hour === h);
    if (rowIndex === -1) return null;
    const ROW_H = 40;
    return {
      top: 48 + rowIndex * ROW_H + (m / 60) * ROW_H,
      dayIndex: day - 1,
    };
  };

  const now = getNowPos();

  // 그리드 셀 하나 렌더링: 빈칸('-'/null)은 점무늬 배경, 병합된 셀은 rowSpan + endTime 있으면 부분 높이로 그림
  const renderCell = (cell: GymScheduleCell | '-' | null, span: number | undefined, startHour: number) => {
    if (cell === null) return null;
    if (cell === '-') return <td className={`${styles.emptyCell} h-10 border-b border-r border-slate-200 p-0.5 relative`} />;
    const s = COLORS[cell.type] ?? COLORS.orange; // cell.type이 팔레트에 없는 값이면(방어적) 첫 색으로 대체 — 렌더 중 크래시 방지
    let innerH = '100%';
    let alignTop = false;
    if (cell.endTime && span && span > 1) {
      const [endH, endM] = cell.endTime.split(':').map(Number);
      innerH = `${((endH + endM / 60 - startHour) / span) * 100}%`;
      alignTop = true;
    }
    return (
      <td rowSpan={span} className={`h-10 border-b border-r border-slate-200 p-0.5 relative${alignTop ? ' align-top' : ''}`}>
        <div
          className="rounded border flex flex-col justify-center items-center gap-px"
          style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border, height: innerH, flexShrink: 0 }}
        >
          <CourseName name={cell.name} />
        </div>
      </td>
    );
  };

  return (
    <div className="pb-20 font-['Pretendard',-apple-system,sans-serif] [animation:slideUp_0.4s_ease-out]">
      {/* 헤더 */}
      <header className="flex items-center gap-4 mb-3">
        <button
          className="w-10 h-10 rounded-card bg-white border border-slate-200 flex items-center justify-center text-text-sub shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        {!gymData || !currentPeriod ? (
          <h1 className="text-xl font-bold text-text-main m-0">체대 헬스장</h1>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-text-main m-0">체대 헬스장</h1>

              {/* 기간 선택 드롭다운 */}
              <div className="relative inline-block select-none" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(p => !p)}
                  className="bg-[rgba(14,74,132,0.08)] text-primary text-[0.68rem] font-black px-2.5 py-1 rounded-card uppercase flex items-center gap-1 transition-all active:scale-95 duration-100 hover:bg-[rgba(14,74,132,0.14)]"
                >
                  <span>{currentPeriod.title}</span>
                  <ChevronDown size={11} className={`text-primary transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-[calc(100%+6px)] left-0 min-w-[130px] bg-white border border-slate-200 rounded-card shadow-[0_12px_24px_rgba(0,0,0,0.08)] overflow-hidden z-[200] [animation:sttDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
                    {gymData.periods.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActivePeriodId(p.id);
                          setDropdownOpen(false);
                        }}
                        className={`px-3.5 py-2.5 text-[0.78rem] font-bold cursor-pointer transition-colors duration-100 hover:bg-surface flex items-center justify-between ${
                          p.id === activePeriodId ? 'text-primary bg-[rgba(14,74,132,0.04)]' : 'text-text-sub'
                        }`}
                      >
                        <span>{p.title}</span>
                        {p.id === activePeriodId && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[0.8rem] text-text-sub font-medium m-0">{gymData.location} · 평일 {currentPeriod.openTime} - {currentPeriod.closeTime}</p>
          </div>
        )}
      </header>

      {/* periods가 빈 배열이면 GymRepository가 이미 throw하므로, gymData가 있으면 currentPeriod도
          항상 있다 — 로딩/에러 2단계로 충분하다 (에러엔 재시도 버튼, Sentry는 전역 onError가 캡처) */}
      {!gymData || !currentPeriod ? (
        loadErr ? (
          // 2. 에러 — 조회 실패 (운영 기간이 하나도 없는 경우 포함)
          <CardFallback message={loadErr} onRetry={refetch} className="min-h-[528px]" />
        ) : (
          // 1. 로딩 중 — 아직 응답 안 옴 (스켈레톤)
          <GymScheduleSkeleton />
        )
      ) : (
        // 3. 정상 — gymData/currentPeriod 둘 다 있음 (메인 렌더)
        <>
          {/* 방학 단축 운영 안내 배너 */}
          <NoticeBanner
            shouldShow={currentPeriod.periodType === 'vacation'}
            message="방학 기간에는 수업이 없고 19시까지로 단축 운영해요 💪"
          />

          {/* 시간표 테이블: 현재시각 인디케이터 + 요일별 그리드 — 백엔드 데이터 형태 문제로 렌더가
              터져도 이 영역만 대체 UI로 바뀌도록 경계로 감쌈 (헤더/뒤로가기는 살아있음) */}
          <ErrorBoundary name="gym-schedule-grid" fallback={<CardFallback message="체대 헬스장 시간표를 표시할 수 없습니다" />}>
            <div className="mb-8">
              <div className="bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden relative">
                {now && (
                  <div className="absolute left-0 right-0 z-[50] pointer-events-none transition-[top_0.3s_cubic-bezier(0.4,0,0.2,1)]" style={{ top: `${now.top}px` }}>
                    <div className="h-[1.5px] bg-error w-full opacity-20" />
                    <div
                      className={`absolute top-0 -translate-x-1/2 -translate-y-1/2 bg-error text-white px-[6px] py-px rounded-full text-[0.55rem] font-black shadow-[0_4px_10px_rgba(239,68,68,0.3)] flex items-center gap-[3px] whitespace-nowrap ${styles.nowMarker}`}
                      style={{ left: `calc(12% + (88% / 5) * ${now.dayIndex} + (88% / 10))` }}
                    >
                      <span>지금</span>
                    </div>
                  </div>
                )}
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr>
                      <th className="py-3 px-1 text-[0.7rem] font-bold text-text-sub border-b border-slate-200 text-center" style={{ width: '12%' }} />
                      {['월', '화', '수', '목', '금'].map(d => (
                        <th key={d} className="py-3 px-1 text-[0.7rem] font-bold text-text-sub border-b border-slate-200 text-center" style={{ width: '17.6%' }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, i) => {
                      const isClosedRow = closingHour !== null && row.hour >= closingHour;
                      return (
                        <tr key={i}>
                          <td className="py-2 px-1 text-[0.65rem] font-bold text-text-sub text-center border-r border-slate-200">{row.label}</td>
                          {isClosedRow ? (
                            <td colSpan={5} className="bg-slate-50 text-text-hint text-[0.65rem] font-bold text-center py-2 h-10 border-b border-slate-200">
                              운영 종료
                            </td>
                          ) : (
                            <>
                              {renderCell(row.mon, row.spans.mon, row.hour)}
                              {renderCell(row.tue, row.spans.tue, row.hour)}
                              {renderCell(row.wed, row.spans.wed, row.hour)}
                              {renderCell(row.thu, row.spans.thu, row.hour)}
                              {renderCell(row.fri, row.spans.fri, row.hour)}
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </ErrorBoundary>

          {/* 하단 주의문 */}
          <footer className="px-2 flex flex-col gap-1.5">
            <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 기상악화로 인해 체대 실외수업이 실내수업으로 전환되거나, 체대에서 행사가 진행될 경우 체대 사용이 어려울 수 있습니다. 이 경우 체대 정문이나 헬스장 출입문에 관련 안내가 부착되니 참고 바랍니다.</p>
            <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 수업 시간에는 일반 학생 이용이 제한됩니다.</p>
            <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 학기별 수업 일정에 따라 변동될 수 있습니다.</p>
          </footer>
        </>
      )}
    </div>
  );
}
