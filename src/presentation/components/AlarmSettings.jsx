import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { requestNotificationPermission } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

const ITEM_H = 36;
const VISIBLE = 3;

const HOUR_LIST = Array.from({ length: 12 }, (_, i) => i); // 0~11
const AMPM_LIST = ['오전', '오후'];
const DAY_LIST = ['전날', '당일'];

// h24 → 표시용 분리
const parseH24 = (h24) => ({
  displayHour: h24 % 12,        // 0~11
  ampmIdx:     h24 < 12 ? 0 : 1, // 0=오전, 1=오후
});

// 표시값 → h24
const toH24 = (displayHour, ampmIdx) => ampmIdx === 0 ? displayHour : displayHour + 12;


function TimePicker({ value, onChange, day, onDayChange }) {
  const h24     = Math.max(0, Math.min(parseInt(value.split(':')[0]) || 0, 23));
  const initDay = Math.max(0, DAY_LIST.indexOf(day));
  const { displayHour: initHour, ampmIdx: initAmpm } = parseH24(h24);

  // 즉시 색상 피드백용 live state (스크롤하면 바로 반영)
  const [liveHour, setLiveHour] = useState(initHour);
  const [liveAmpm, setLiveAmpm] = useState(initAmpm);
  const [liveDay,  setLiveDay]  = useState(initDay);

  const hourRef = useRef(null);
  const ampmRef = useRef(null);
  const dayRef  = useRef(null);
  const hourTimer = useRef(null);
  const ampmTimer = useRef(null);
  const dayTimer  = useRef(null);

  // 최초 마운트 시 스크롤 위치 초기화
  useLayoutEffect(() => {
    if (hourRef.current) hourRef.current.scrollTop = initHour * ITEM_H;
    if (ampmRef.current) ampmRef.current.scrollTop = initAmpm * ITEM_H;
    if (dayRef.current)  dayRef.current.scrollTop  = initDay  * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 외부에서 value가 바뀔 때 live state 동기화
  useEffect(() => {
    const { displayHour, ampmIdx } = parseH24(h24);
    setLiveHour(displayHour);
    setLiveAmpm(ampmIdx);
  }, [h24]);

  useEffect(() => {
    setLiveDay(initDay);
  }, [initDay]);

  // DOM 현재 위치를 읽어 onChange/onDayChange 호출
  const commitTime = () => {
    const hourEl = hourRef.current;
    const ampmEl = ampmRef.current;
    if (!hourEl || !ampmEl) return;
    const curHour = Math.max(0, Math.min(Math.round(hourEl.scrollTop / ITEM_H), 11));
    const curAmpm = Math.max(0, Math.min(Math.round(ampmEl.scrollTop / ITEM_H), 1));
    const newH24  = toH24(curHour, curAmpm);
    if (newH24 !== h24) onChange(`${String(newH24).padStart(2, '0')}:00`);
  };

  const commitDay = () => {
    const el = dayRef.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), 1));
    if (DAY_LIST[idx] !== day) onDayChange(DAY_LIST[idx]);
  };

  // --- 스크롤 핸들러 (즉시 live 색상 + 디바운스 commit) ---
  const handleHourScroll = () => {
    const el = hourRef.current;
    if (!el) return;
    setLiveHour(Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), 11)));
    clearTimeout(hourTimer.current);
    hourTimer.current = setTimeout(commitTime, 150);
  };

  const handleAmpmScroll = () => {
    const el = ampmRef.current;
    if (!el) return;
    setLiveAmpm(Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), 1)));
    clearTimeout(ampmTimer.current);
    ampmTimer.current = setTimeout(commitTime, 150);
  };

  const handleDayScroll = () => {
    const el = dayRef.current;
    if (!el) return;
    setLiveDay(Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), 1)));
    clearTimeout(dayTimer.current);
    dayTimer.current = setTimeout(commitDay, 150);
  };

  // --- 마우스 휠 핸들러 ---
  const handleHourWheel = (e) => {
    e.preventDefault();
    const el = hourRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H) + (e.deltaY > 0 ? 1 : -1), 11));
    el.scrollTop = next * ITEM_H;
    setLiveHour(next);
  };

  const handleAmpmWheel = (e) => {
    e.preventDefault();
    const el = ampmRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H) + (e.deltaY > 0 ? 1 : -1), 1));
    el.scrollTop = next * ITEM_H;
    setLiveAmpm(next);
  };

  const handleDayWheel = (e) => {
    e.preventDefault();
    const el = dayRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H) + (e.deltaY > 0 ? 1 : -1), 1));
    el.scrollTop = next * ITEM_H;
    setLiveDay(next);
  };

  const itemStyle = (active) => ({
    height: ITEM_H,
    scrollSnapAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: active ? 700 : 400,
    color: active ? '#1e293b' : '#d1d5db',
    userSelect: 'none',
  });

  const colStyle = (width) => ({
    height: ITEM_H * VISIBLE,
    overflowY: 'auto',
    scrollSnapType: 'y mandatory',
    width,
    touchAction: 'pan-y',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    cursor: 'grab',
  });

  // --- 드래그로 휠 돌리기 (마우스용) ---
  const handleDragScroll = (ref, liveSetter) => {
    let isDown = false;
    let startY;
    let scrollTop;

    const onDown = (e) => {
      isDown = true;
      ref.current.style.cursor = 'grabbing';
      startY = e.pageY - ref.current.offsetTop;
      scrollTop = ref.current.scrollTop;
    };

    const onLeave = () => {
      isDown = false;
      ref.current.style.cursor = 'grab';
    };

    const onUp = () => {
      isDown = false;
      ref.current.style.cursor = 'grab';
    };

    const onMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const y = e.pageY - ref.current.offsetTop;
      const walk = (y - startY) * 1.2; // 감도 조절 (1.5 -> 1.2)
      ref.current.scrollTop = scrollTop - walk;
    };

    return { onMouseDown: onDown, onMouseLeave: onLeave, onMouseUp: onUp, onMouseMove: onMove };
  };

  return (
    <div 
      onMouseDown={e => e.stopPropagation()}
      onMouseMove={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        height: ITEM_H * VISIBLE,
        background: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        width: 'fit-content',
        margin: '0 auto',
      }}
    >
      {/* 선택 하이라이트 바 */}
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
        {...handleDragScroll(dayRef, setLiveDay)}
        className="alarm-picker-scroll"
        style={colStyle(64)}
      >
        <div style={{ height: ITEM_H }} />
        {DAY_LIST.map((opt, idx) => (
          <div key={opt} style={itemStyle(idx === liveDay)}>{opt}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      {/* 오전/오후 */}
      <div
        ref={ampmRef}
        onScroll={handleAmpmScroll}
        {...handleDragScroll(ampmRef, setLiveAmpm)}
        className="alarm-picker-scroll"
        style={colStyle(56)}
      >
        <div style={{ height: ITEM_H }} />
        {AMPM_LIST.map((opt, idx) => (
          <div key={opt} style={itemStyle(idx === liveAmpm)}>{opt}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      {/* 시간 0~11 */}
      <div
        ref={hourRef}
        onScroll={handleHourScroll}
        {...handleDragScroll(hourRef, setLiveHour)}
        className="alarm-picker-scroll"
        style={colStyle(44)}
      >
        <div style={{ height: ITEM_H }} />
        {HOUR_LIST.map((h, idx) => (
          <div key={h} style={itemStyle(idx === liveHour)}>{h}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 2,
        paddingRight: 16,
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
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0); // 드래그 거리
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const backdropRef = useRef(null);
  const sheetRef = useRef(null);

  const isDirty = !settingsEqual(settings, savedRef.current);

  // iOS 배경 스크롤 잠금
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // 백드롭 터치무브 방지 (iOS에서 배경 스크롤 방지)
  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const prevent = (e) => {
      // 시트 내부의 스크롤 요소가 아닐 때만 차단
      if (!e.target.closest('.alarm-picker-scroll')) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  // 드래그 제어 핸들러 (전체 시트용)
  const handleTouchStart = (e) => {
    // 내부 스크롤 중이면 드래그 무시
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return;
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY.current;

    // 아래로 내릴 때만 시트 이동
    if (deltaY > 0) {
      // 이벤트 전파 방지 (스크롤 발생 차단)
      if (e.cancelable) e.preventDefault();
      setDragY(deltaY);
    } else {
      // 위로 올리려 할 때는 드래그 중단 (내부 스크롤 허용)
      setDragY(0);
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY > 120) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  const toggle = async () => {
    const turningOn = !settings.jeyukAlert;
    setSettings(p => ({ ...p, jeyukAlert: turningOn }));
    if (turningOn) {
      const token = await requestNotificationPermission();
      if (!token) {
        alert('알림 권한을 허용해야 기능을 사용할 수 있습니다.');
        setSettings(p => ({ ...p, jeyukAlert: false }));
      }
    }
  };

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !settings.keywords.includes(trimmed)) {
      setSettings(p => ({ ...p, keywords: [...p.keywords, trimmed] }));
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw) =>
    setSettings(p => ({ ...p, keywords: p.keywords.filter(k => k !== kw) }));

  // 닫힘 애니메이션 후 실제 onClose 호출
  const triggerClose = (msg) => {
    setClosing(true);
    // 애니메이션 속도와 맞춤 (260ms)
    setTimeout(() => {
      onClose(msg);
    }, 250);
  };

  const handleClose = () => {
    let successMsg;
    if (isDirty) {
      localStorage.setItem('alarm_settings', JSON.stringify(settings));

      if (settings.jeyukAlert && settings.keywords.length > 0) {
        successMsg = '설정한 시간에 맞춰\n알림을 보내드릴게요!';

        (async () => {
          try {
            const token = await requestNotificationPermission();
            if (token) {
              let deviceId = localStorage.getItem('device_id');
              if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem('device_id', deviceId);
              }
              await supabase.from('devices').upsert(
                { id: deviceId, fcm_token: token, platform: 'web', last_active_at: new Date().toISOString() },
                { onConflict: 'id' }
              );
              const { data: existingSub } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('device_id', deviceId)
                .eq('topic', 'CAFETERIA_KEYWORD')
                .maybeSingle();
              if (existingSub) {
                await supabase
                  .from('subscriptions')
                  .update({ params: { keywords: settings.keywords, notifyTime: settings.notifyTime, notifyDay: settings.notifyDay }, is_active: true, updated_at: new Date().toISOString() })
                  .eq('id', existingSub.id);
              } else {
                await supabase
                  .from('subscriptions')
                  .insert({ device_id: deviceId, topic: 'CAFETERIA_KEYWORD', params: { keywords: settings.keywords, notifyTime: settings.notifyTime, notifyDay: settings.notifyDay } });
              }
            }
          } catch (err) {
            console.error('Failed to sync alarm settings', err);
          }
        })();
      } else if (!settings.jeyukAlert) {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          supabase.from('subscriptions')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('device_id', deviceId)
            .eq('topic', 'CAFETERIA_KEYWORD')
            .then();
        }
      }
    }
    triggerClose(successMsg);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/45 z-[1100] flex items-end justify-center"
      style={{ animation: closing ? 'fadeOut 0.26s ease forwards' : 'fadeIn 0.2s ease' }}
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        className="w-[calc(100%-64px)] max-w-[300px] bg-white rounded-card px-5 pb-6 max-h-[90vh] overflow-y-auto mb-0 relative select-none shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        style={{ 
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: closing ? 'sheetDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards' : 'sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform'
        }}
        onClick={e => e.stopPropagation()}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="py-3">
          <div className="w-9 h-1 bg-[#e2e8f0] rounded-full mx-auto" />
        </div>

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
