import React, { useState, useRef, useLayoutEffect } from 'react';
import { X, Plus } from 'lucide-react';

const ITEM_H = 36;
const VISIBLE = 3;

const TIME_LIST = Array.from({ length: 24 }, (_, h) => ({
  h24: h,
  hourStr: h === 0 ? '0' : h < 12 ? String(h) : h === 12 ? '12' : String(h - 12),
  ampm: h < 12 ? '오전' : '오후',
}));

const AMPM_LIST = ['오전', '오후'];
const DAY_LIST = ['전날', '당일'];

function TimePicker({ value, onChange, day, onDayChange }) {
  const timeIdx = Math.max(0, Math.min(parseInt(value.split(':')[0]), 23));
  const currentAmpm = timeIdx < 12 ? '오전' : '오후';
  const dayIdx = DAY_LIST.indexOf(day) === -1 ? 1 : DAY_LIST.indexOf(day);

  const hourRef = useRef(null);
  const ampmRef = useRef(null);
  const dayRef = useRef(null);
  const hourTimerRef = useRef(null);
  const dayTimerRef = useRef(null);

  useLayoutEffect(() => {
    if (hourRef.current) hourRef.current.scrollTop = timeIdx * ITEM_H;
    if (ampmRef.current) ampmRef.current.scrollTop = (timeIdx < 12 ? 0 : 1) * ITEM_H;
    if (dayRef.current) dayRef.current.scrollTop = dayIdx * ITEM_H;
  }, [timeIdx, dayIdx]);

  const handleHourScroll = () => {
    clearTimeout(hourTimerRef.current);
    hourTimerRef.current = setTimeout(() => {
      const el = hourRef.current;
      if (!el) return;
      const idx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), 23));
      if (ampmRef.current) ampmRef.current.scrollTop = (idx < 12 ? 0 : 1) * ITEM_H;
      const newH24 = TIME_LIST[idx].h24;
      if (newH24 !== timeIdx) onChange(`${String(newH24).padStart(2, '0')}:00`);
    }, 200);
  };

  const handleHourWheel = (e) => {
    e.preventDefault();
    const el = hourRef.current;
    if (!el) return;
    const current = Math.round(el.scrollTop / ITEM_H);
    const next = e.deltaY > 0 ? Math.min(current + 1, 23) : Math.max(current - 1, 0);
    el.scrollTop = next * ITEM_H;
  };

  const handleDayScroll = () => {
    clearTimeout(dayTimerRef.current);
    dayTimerRef.current = setTimeout(() => {
      const el = dayRef.current;
      if (!el) return;
      const idx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), 1));
      if (DAY_LIST[idx] !== day) onDayChange(DAY_LIST[idx]);
    }, 200);
  };

  const handleDayWheel = (e) => {
    e.preventDefault();
    const el = dayRef.current;
    if (!el) return;
    const current = Math.round(el.scrollTop / ITEM_H);
    const next = e.deltaY > 0 ? Math.min(current + 1, 1) : Math.max(current - 1, 0);
    el.scrollTop = next * ITEM_H;
  };

  const itemStyle = (active) => ({
    height: ITEM_H,
    scrollSnapAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: active ? 500 : 400,
    color: active ? '#4b5563' : '#d1d5db',
    userSelect: 'none',
  });

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'stretch',
      height: ITEM_H * VISIBLE,
      background: 'white',
      borderRadius: 10,
      overflow: 'hidden',
      width: 'fit-content',
      margin: '0 auto',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: ITEM_H,
        transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: 8,
        pointerEvents: 'none',
      }} />

      {/* 전날/당일 */}
      <div
        ref={dayRef}
        onScroll={handleDayScroll}
        onWheel={handleDayWheel}
        className="alarm-picker-scroll"
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          width: 64,
        }}
      >
        <div style={{ height: ITEM_H }} />
        {DAY_LIST.map((opt, idx) => (
          <div key={opt} style={itemStyle(idx === dayIdx)}>{opt}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      {/* 오전/오후 */}
      <div
        ref={ampmRef}
        className="alarm-picker-scroll"
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          width: 64,
          pointerEvents: 'none',
        }}
      >
        <div style={{ height: ITEM_H }} />
        {AMPM_LIST.map((opt) => (
          <div key={opt} style={itemStyle(opt === currentAmpm)}>{opt}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      {/* 시간 */}
      <div
        ref={hourRef}
        onScroll={handleHourScroll}
        onWheel={handleHourWheel}
        className="alarm-picker-scroll"
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          width: 52,
        }}
      >
        <div style={{ height: ITEM_H }} />
        {TIME_LIST.map((t, idx) => (
          <div key={t.h24} style={itemStyle(idx === timeIdx)}>{t.hourStr}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 2,
        paddingRight: 18,
        fontSize: 13,
        fontWeight: 500,
        color: '#4b5563',
        flexShrink: 0,
        position: 'relative',
      }}>
        시
      </div>
    </div>
  );
}

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('alarm_settings');
    if (!saved) return { jeyukAlert: false, keywords: [], notifyTime: '08:00', notifyDay: '당일' };
    const parsed = JSON.parse(saved);
    if (parsed.notifyTime) {
      const h = parseInt(parsed.notifyTime.split(':')[0]);
      if (isNaN(h) || h < 0 || h > 23) parsed.notifyTime = '08:00';
    }
    if (!DAY_LIST.includes(parsed.notifyDay)) parsed.notifyDay = '당일';
    return { jeyukAlert: false, keywords: [], notifyTime: '08:00', notifyDay: '당일', ...parsed };
  } catch {
    return { jeyukAlert: false, keywords: [], notifyTime: '08:00', notifyDay: '당일' };
  }
};

const settingsEqual = (a, b) =>
  a.jeyukAlert === b.jeyukAlert &&
  a.notifyTime === b.notifyTime &&
  a.notifyDay === b.notifyDay &&
  JSON.stringify(a.keywords) === JSON.stringify(b.keywords);

export function AlarmSettings({ onClose }) {
  const savedRef = useRef(loadSettings());
  const [settings, setSettings] = useState(() => ({
    ...savedRef.current,
    keywords: [...savedRef.current.keywords],
  }));
  const [keywordInput, setKeywordInput] = useState('');

  const isDirty = !settingsEqual(settings, savedRef.current);

  const toggle = () => setSettings(p => ({ ...p, jeyukAlert: !p.jeyukAlert }));

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !settings.keywords.includes(trimmed)) {
      setSettings(p => ({ ...p, keywords: [...p.keywords, trimmed] }));
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw) =>
    setSettings(p => ({ ...p, keywords: p.keywords.filter(k => k !== kw) }));

  const handleClose = () => {
    if (isDirty) {
      localStorage.setItem('alarm_settings', JSON.stringify(settings));
      if (settings.jeyukAlert && settings.keywords.length > 0) {
        const h = parseInt(settings.notifyTime.split(':')[0]);
        const t = TIME_LIST[Math.max(0, Math.min(h, 23))];
        onClose('설정한 시간에 맞춰\n알림을 보내드릴게요');
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 z-[1100] flex items-end justify-center [animation:fadeIn_0.2s_ease]" onClick={handleClose}>
      <div
        className="w-[calc(100%-64px)] max-w-[300px] bg-white rounded-card px-5 pb-4 max-h-[90vh] overflow-y-auto [animation:sheetUp_0.3s_cubic-bezier(0.16,1,0.3,1)] mb-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-[#e2e8f0] rounded-full mx-auto mt-3" />

        <div className="flex items-center justify-between py-3.5 pb-2.5 border-b border-[#f1f5f9] mb-0.5">
          <span className="text-[18px] font-extrabold text-text-main leading-none">학식 알림설정</span>
          <label className="alarm-toggle" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <input type="checkbox" checked={settings.jeyukAlert} onChange={toggle} />
            <span className="alarm-toggle-slider" />
          </label>
        </div>

        <div style={{
          opacity: settings.jeyukAlert ? 1 : 0.35,
          pointerEvents: settings.jeyukAlert ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}>
          <div className="py-2 border-b border-[#f1f5f9]">
            <div className="text-[14px] font-extrabold text-text-main mb-1.5">키워드</div>
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 h-10 border-[1.5px] border-[#e2e8f0] rounded-card px-3 text-[14px] text-text-main bg-surface outline-none transition-colors duration-200 focus:border-[#3b82f6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addKeyword()}
                placeholder="키워드 입력"
              />
              <button
                className="w-10 h-10 bg-[#3b82f6] text-white border-none rounded-card flex items-center justify-center cursor-pointer flex-shrink-0 transition-opacity duration-150 hover:opacity-[0.88]"
                onClick={addKeyword}
              >
                <Plus size={18} />
              </button>
            </div>
            {settings.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {settings.keywords.map(kw => (
                  <span key={kw} className="flex items-center gap-1 bg-[rgba(59,130,246,0.1)] text-[#3b82f6] text-[12px] font-bold px-3 py-1 rounded-full">
                    {kw}
                    <button
                      className="bg-none border-none text-[#3b82f6] cursor-pointer flex items-center p-0 opacity-70 transition-opacity duration-150 hover:opacity-100"
                      onClick={() => removeKeyword(kw)}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="py-2">
            <div className="text-[14px] font-extrabold text-text-main mb-1.5">언제 알림을 보낼까요?</div>
            <TimePicker
              value={settings.notifyTime}
              onChange={(t) => setSettings(p => ({ ...p, notifyTime: t }))}
              day={settings.notifyDay}
              onDayChange={(d) => setSettings(p => ({ ...p, notifyDay: d }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
