// 컴포넌트: 체대 헬스장 수업 시간표 캘린더 (현재 시간 인디케이터 포함)
import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import gymData from '../../assets/gymSchedule.json';

const COLORS = {
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#CCFBF1' },
  green:  { bg: '#F7FEE7', text: '#4D7C0F', border: '#ECFCCB' },
  blue:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE' },
  red:    { bg: '#FEF2F2', text: '#B91C1C', border: '#FEE2E2' },
};

const BASE_SCHEDULE = gymData.schedule;

const getMergedSchedule = () => {
  const days   = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const merged = BASE_SCHEDULE.map(row => ({ ...row, spans: {} }));
  days.forEach(day => {
    for (let i = 0; i < BASE_SCHEDULE.length; i++) {
      const current = BASE_SCHEDULE[i][day];
      if (current === '-' || current === null) continue;
      let span = 1;
      while (i + span < BASE_SCHEDULE.length && BASE_SCHEDULE[i + span][day]?.name === current.name) span++;
      if (span > 1) {
        merged[i].spans[day] = span;
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const schedule = getMergedSchedule();

  const getNowPos = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const day = currentTime.getDay();
    if (h < 9 || h >= 21 || day === 0 || day === 6) return null;
    const rowIndex = BASE_SCHEDULE.findIndex(s => s.hour === h);
    if (rowIndex === -1) return null;
    const ROW_H = 40;
    return {
      top: 48 + rowIndex * ROW_H + (m / 60) * ROW_H,
      dayIndex: day - 1,
    };
  };

  const now = getNowPos();

  const renderCell = (cell, span) => {
    if (cell === null) return null;
    if (cell === '-') return <td className="cal-cell empty h-10 border-b border-r border-surface p-0.5 relative" />;
    const s = COLORS[cell.type];
    return (
      <td rowSpan={span} className="h-10 border-b border-r border-surface p-0.5 relative">
        <div
          className="h-full rounded border flex flex-col justify-center items-center gap-px"
          style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
        >
          <CourseName name={cell.name} />
        </div>
      </td>
    );
  };

  return (
    <div className="bg-surface min-h-screen font-['Pretendard',-apple-system,sans-serif]">
      <header className="flex items-center gap-4 mb-6">
        <button
          className="w-10 h-10 rounded-card bg-white border border-[#e2e8f0] flex items-center justify-center text-text-sub shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-text-main m-0">체대 헬스장</h1>
            <span className="bg-[rgba(14,74,132,0.1)] text-primary text-[0.65rem] font-extrabold px-2 py-0.5 rounded uppercase">
              {gymData.semester}
            </span>
          </div>
          <p className="text-[0.8rem] text-text-sub font-medium m-0">{gymData.location} · {gymData.hours}</p>
        </div>
      </header>

      <div className="mb-8">
        <div className="bg-white rounded-card border border-[#e2e8f0] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden relative">
          {now && (
            <div className="absolute left-0 right-0 z-[50] pointer-events-none transition-[top_0.3s_cubic-bezier(0.4,0,0.2,1)]" style={{ top: `${now.top}px` }}>
              <div className="h-[1.5px] bg-error w-full opacity-20" />
              <div
                className="absolute top-0 -translate-x-1/2 -translate-y-1/2 bg-error text-white px-[6px] py-px rounded-full text-[0.55rem] font-black shadow-[0_4px_10px_rgba(239,68,68,0.3)] flex items-center gap-[3px] cal-now-marker"
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
              {schedule.map((row, i) => (
                <tr key={i}>
                  <td className="py-2 px-1 text-[0.65rem] font-bold text-[#cbd5e1] text-center border-r border-surface">{row.label}</td>
                  {renderCell(row.mon, row.spans.mon)}
                  {renderCell(row.tue, row.spans.tue)}
                  {renderCell(row.wed, row.spans.wed)}
                  {renderCell(row.thu, row.spans.thu)}
                  {renderCell(row.fri, row.spans.fri)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="px-2 flex flex-col gap-1.5">
        <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 수업 시간에는 일반 학생 이용이 제한됩니다.</p>
        <p className="text-[0.7rem] text-text-hint m-0 font-medium">* 학기별 수업 일정에 따라 변동될 수 있습니다.</p>
      </footer>
    </div>
  );
}
