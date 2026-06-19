// 컴포넌트: 체대 헬스장 수업 시간표 캘린더 (현재 시간 인디케이터 포함)
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import gymData from '../../assets/gymSchedule.json';

const COLORS = {
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' },
  green:  { bg: '#F7FEE7', text: '#4D7C0F', border: '#ECFCCB' },
  blue:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  red:    { bg: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' },
};

const getMergedSchedule = (baseSchedule) => {
  const days   = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const merged = baseSchedule.map(row => ({ ...row, spans: {} }));
  days.forEach(day => {
    for (let i = 0; i < baseSchedule.length; i++) {
      const current = baseSchedule[i][day];
      if (current === '-' || current === null) continue;
      let span = 1;
      while (i + span < baseSchedule.length && baseSchedule[i + span][day]?.name === current.name) span++;
      if (span > 1) {
        merged[i].spans[day] = span;
        const lastCell = baseSchedule[i + span - 1][day];
        if (lastCell?.endTime) merged[i][day] = { ...merged[i][day], endTime: lastCell.endTime };
        for (let j = 1; j < span; j++) merged[i + j][day] = null;
        i += span - 1;
      }
    }
  });
  return merged;
};

function CourseName({ name }) {
  return (
    <div className="course-name text-[0.6rem] font-extrabold leading-[1.1] overflow-hidden w-full text-center flex flex-col items-center">
      {name.split('\n').map((line, i) => (
        <span key={i} className="course-name-line block">{line}</span>
      ))}
    </div>
  );
}

export function GymTimetable({ onBack }) {
  // 오늘 날짜 기준 현재 기간 자동 판별
  const initialPeriodId = React.useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const matched = gymData.periods.find(p => p.startDate <= todayStr && todayStr <= p.endDate);
    return matched ? matched.id : 'semester';
  }, []);

  const [activePeriodId, setActivePeriodId] = useState(initialPeriodId);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentPeriod = gymData.periods.find(p => p.id === activePeriodId) || gymData.periods[0];
  const baseSchedule = currentPeriod.schedule;
  const schedule = React.useMemo(() => getMergedSchedule(baseSchedule), [baseSchedule]);

  const closingHour = React.useMemo(() => {
    const match = currentPeriod.hours.match(/-\s*(\d{2}):\d{2}/);
    return match ? parseInt(match[1], 10) : null;
  }, [currentPeriod.hours]);

  const getNowPos = () => {
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

  const renderCell = (cell, span, startHour) => {
    if (cell === null) return null;
    if (cell === '-') return <td className="cal-cell empty h-10 border-b border-r border-surface p-0.5 relative" />;
    const s = COLORS[cell.type];
    let innerH = '100%';
    let alignTop = false;
    if (cell.endTime && span > 1) {
      const [endH, endM] = cell.endTime.split(':').map(Number);
      innerH = `${((endH + endM / 60 - startHour) / span) * 100}%`;
      alignTop = true;
    }
    return (
      <td rowSpan={span} className={`h-10 border-b border-r border-surface p-0.5 relative${alignTop ? ' align-top' : ''}`}>
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
      <header className="flex items-center gap-4 mb-6">
        <button
          className="w-10 h-10 rounded-card bg-white border border-[#e2e8f0] flex items-center justify-center text-text-sub shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
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
                <div className="absolute top-[calc(100%+6px)] left-0 min-w-[130px] bg-white border border-[#e2e8f0] rounded-card shadow-[0_12px_24px_rgba(0,0,0,0.08)] overflow-hidden z-[200] [animation:sttDropIn_0.18s_cubic-bezier(0.16,1,0.3,1)]">
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
          <p className="text-[0.8rem] text-text-sub font-medium m-0">{gymData.location} · {currentPeriod.hours}</p>
        </div>
      </header>

      <div className="mb-8">
        <div className="bg-white rounded-card border border-[#e2e8f0] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden relative">
          {now && (
            <div className="absolute left-0 right-0 z-[50] pointer-events-none transition-[top_0.3s_cubic-bezier(0.4,0,0.2,1)]" style={{ top: `${now.top}px` }}>
              <div className="h-[1.5px] bg-error w-full opacity-20" />
              <div
                className="absolute top-0 -translate-x-1/2 -translate-y-1/2 bg-error text-white px-[6px] py-px rounded-full text-[0.55rem] font-black shadow-[0_4px_10px_rgba(239,68,68,0.3)] flex items-center gap-[3px] whitespace-nowrap cal-now-marker"
                style={{ left: `calc(12% + (88% / 5) * ${now.dayIndex} + (88% / 10))` }}
              >
                <span>지금</span>
              </div>
            </div>
          )}
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="py-3 px-1 text-[0.7rem] font-bold text-text-hint border-b border-[#f1f5f9] text-center" style={{ width: '12%' }} />
                {['월', '화', '수', '목', '금'].map(d => (
                  <th key={d} className="py-3 px-1 text-[0.7rem] font-bold text-text-hint border-b border-[#f1f5f9] text-center" style={{ width: '17.6%' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) => {
                const isClosedRow = closingHour !== null && row.hour >= closingHour;
                return (
                  <tr key={i}>
                    <td className="py-2 px-1 text-[0.65rem] font-bold text-[#cbd5e1] text-center border-r border-surface">{row.label}</td>
                    {isClosedRow ? (
                      <td colSpan={5} className="bg-slate-50 text-[#cbd5e1] text-[0.65rem] font-bold text-center py-2 h-10 border-b border-surface">
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

      <footer className="px-2 flex flex-col gap-1.5">
        <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 기상악화로 인해 체대 실외수업이 실내수업으로 전환되거나, 체대에서 행사가 진행될 경우 체대 사용이 어려울 수 있습니다. 이 경우 체대 정문이나 헬스장 출입문에 관련 안내가 부착되니 참고 바랍니다.</p>
        <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 수업 시간에는 일반 학생 이용이 제한됩니다.</p>
        <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 학기별 수업 일정에 따라 변동될 수 있습니다.</p>
      </footer>
    </div>
  );
}
