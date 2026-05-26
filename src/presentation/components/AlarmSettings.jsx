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
  ampmIdx: h24 < 12 ? 0 : 1, // 0=오전, 1=오후
});

// 표시값 → h24
const toH24 = (displayHour, ampmIdx) => ampmIdx === 0 ? displayHour : displayHour + 12;


function TimePicker({ value, onChange, day, onDayChange }) {
  const h24 = Math.max(0, Math.min(parseInt(value.split(':')[0]) || 0, 23));
  const initDay = Math.max(0, DAY_LIST.indexOf(day));
  const { displayHour: initHour, ampmIdx: initAmpm } = parseH24(h24);

  // 즉시 색상 피드백용 live state (스크롤하면 바로 반영)
  const [liveHour, setLiveHour] = useState(initHour);
  const [liveAmpm, setLiveAmpm] = useState(initAmpm);
  const [liveDay, setLiveDay] = useState(initDay);

  const hourRef = useRef(null);
  const ampmRef = useRef(null);
  const dayRef = useRef(null);
  const hourTimer = useRef(null);
  const ampmTimer = useRef(null);
  const dayTimer = useRef(null);

  const hourWheelCooldown = useRef(false);
  const ampmWheelCooldown = useRef(false);
  const dayWheelCooldown = useRef(false);

  // 최초 마운트 시 스크롤 위치 초기화
  useLayoutEffect(() => {
    if (hourRef.current) hourRef.current.scrollTop = initHour * ITEM_H;
    if (ampmRef.current) ampmRef.current.scrollTop = initAmpm * ITEM_H;
    if (dayRef.current) dayRef.current.scrollTop = initDay * ITEM_H;
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
    const newH24 = toH24(curHour, curAmpm);
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

  // --- 마우스 휠 핸들러 (500ms 쿨다운 쓰로틀링 + 미세 입력 필터링 적용으로 완벽한 쫀득 스냅 조작 구현) ---
  const handleHourWheel = (e) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 10) return; // 미세 진동 입력 무시
    if (hourWheelCooldown.current) return;
    hourWheelCooldown.current = true;
    setTimeout(() => { hourWheelCooldown.current = false; }, 500);

    const el = hourRef.current;
    const ampmEl = ampmRef.current;
    if (!el || !ampmEl) return;

    const cur = Math.round(el.scrollTop / ITEM_H);
    const dir = e.deltaY > 0 ? 1 : -1;
    let next = cur + dir;

    const curAmpm = Math.round(ampmEl.scrollTop / ITEM_H);

    if (next > 11) {
      if (curAmpm === 0) {
        // 오전 11시 -> 오후 12시(0시)로 순환 가능! (정오 경계 스위칭)
        next = 0;
        el.scrollTop = 0;
        setLiveHour(0);

        ampmEl.scrollTop = 1 * ITEM_H;
        setLiveAmpm(1);

        const newH24 = toH24(0, 1);
        onChange(`${String(newH24).padStart(2, '0')}:00`);
      } else {
        // 오후 11시 -> 오전 00시로 순환하지 못하도록 차단!
      }
    } else if (next < 0) {
      if (curAmpm === 1) {
        // 오후 12시(0시) -> 오전 11시로 순환 가능! (정오 경계 스위칭)
        next = 11;
        el.scrollTop = 11 * ITEM_H;
        setLiveHour(11);

        ampmEl.scrollTop = 0;
        setLiveAmpm(0);

        const newH24 = toH24(11, 0);
        onChange(`${String(newH24).padStart(2, '0')}:00`);
      } else {
        // 오전 00시(0시) -> 오후 11시로 순환하지 못하도록 차단!
      }
    } else {
      // 일반적인 휠 이동
      el.scrollTop = next * ITEM_H;
      setLiveHour(next);
      commitTime();
    }
  };

  const handleAmpmWheel = (e) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 10) return; // 미세 진동 입력 무시
    if (ampmWheelCooldown.current) return;
    ampmWheelCooldown.current = true;
    setTimeout(() => { ampmWheelCooldown.current = false; }, 500);

    const el = ampmRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H) + (e.deltaY > 0 ? 1 : -1), 1));
    el.scrollTop = next * ITEM_H;
    setLiveAmpm(next);
    commitTime();
  };

  const handleDayWheel = (e) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 10) return; // 미세 진동 입력 무시
    if (dayWheelCooldown.current) return;
    dayWheelCooldown.current = true;
    setTimeout(() => { dayWheelCooldown.current = false; }, 500);

    const el = dayRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H) + (e.deltaY > 0 ? 1 : -1), 1));
    el.scrollTop = next * ITEM_H;
    setLiveDay(next);
    commitDay();
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
        onWheel={handleDayWheel}
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
        onWheel={handleAmpmWheel}
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
        onWheel={handleHourWheel}
        {...handleDragScroll(hourRef, setLiveHour)}
        className="alarm-picker-scroll"
        style={colStyle(44)}
      >
        <div style={{ height: ITEM_H }} />
        {HOUR_LIST.map((h, idx) => {
          const displayVal = h === 0 ? (liveAmpm === 0 ? "00" : 12) : h;
          return (
            <div key={h} style={itemStyle(idx === liveHour)}>
              {displayVal}
            </div>
          );
        })}
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
    if (!saved) return { jeyukAlert: false, mode: null, selectedCafe: null, keywords: [], notifyTime: '08:00', notifyDay: '당일' };
    const parsed = JSON.parse(saved);
    if (parsed.notifyTime) {
      const h = parseInt(parsed.notifyTime.split(':')[0]);
      if (isNaN(h) || h < 0 || h > 23) parsed.notifyTime = '08:00';
    }
    if (!DAY_LIST.includes(parsed.notifyDay)) parsed.notifyDay = '당일';
    return { jeyukAlert: false, mode: null, selectedCafe: null, keywords: [], notifyTime: '08:00', notifyDay: '당일', ...parsed };
  } catch {
    return { jeyukAlert: false, mode: null, selectedCafe: null, keywords: [], notifyTime: '08:00', notifyDay: '당일' };
  }
};

const settingsEqual = (a, b) =>
  a.jeyukAlert === b.jeyukAlert &&
  a.mode === b.mode &&
  a.selectedCafe === b.selectedCafe &&
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

  const ensureJeyukAlertOn = async () => {
    if (!settings.jeyukAlert) {
      const token = await requestNotificationPermission();
      if (!token) {
        alert('알림 권한을 허용해야 기능을 사용할 수 있습니다.');
        return false;
      }
      setSettings(prev => ({ ...prev, jeyukAlert: true }));
    }
    return true;
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

  const addKeyword = async () => {
    const trimmed = keywordInput.trim();
    if (trimmed) {
      const ok = await ensureJeyukAlertOn();
      if (!ok) return;
      setSettings(p => {
        if (!p.keywords.includes(trimmed)) {
          return { ...p, keywords: [...p.keywords, trimmed] };
        }
        return p;
      });
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

  // 서버 설정과 동기화 (RPC 호출)
  useEffect(() => {
    async function syncWithServer() {
      const deviceId = localStorage.getItem('device_id');
      if (!deviceId) return;

      try {
        const { data, error } = await supabase.rpc('get_alarm_subscription', {
          p_device_id: deviceId,
          p_topic: 'CAFETERIA_KEYWORD'
        });

        if (data && !error) {
          const newSettings = {
            jeyukAlert: data.is_active,
            mode: data.params?.mode || null,
            selectedCafe: data.params?.selectedCafe || null,
            keywords: data.params?.keywords || [],
            notifyTime: data.params?.notifyTime || '08:00',
            notifyDay: data.params?.notifyDay || '당일'
          };
          setSettings(newSettings);
          savedRef.current = newSettings;
          localStorage.setItem('alarm_settings', JSON.stringify(newSettings));
        }
      } catch (err) {
        console.error('Failed to sync settings from server', err);
      }
    }
    syncWithServer();
  }, []);

  const handleClose = () => {
    let successMsg;
    if (isDirty) {
      localStorage.setItem('alarm_settings', JSON.stringify(settings));

      const isSubscribed = settings.jeyukAlert && (settings.mode === 'cafe' || settings.keywords.length > 0);

      if (isSubscribed) {
        successMsg = '설정한 시간에 맞춰\n식단 알림을 보내드릴게요';

        (async () => {
          try {
            const token = await requestNotificationPermission();
            if (token) {
              let deviceId = localStorage.getItem('device_id');
              if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem('device_id', deviceId);
              }

              const params = {
                mode: settings.mode,
                selectedCafe: settings.selectedCafe,
                keywords: settings.keywords,
                notifyTime: settings.notifyTime,
                notifyDay: settings.notifyDay
              };

              await supabase.rpc('upsert_alarm_subscription', {
                p_device_id: deviceId,
                p_fcm_token: token,
                p_topic: 'CAFETERIA_KEYWORD',
                p_params: params,
                p_is_active: true
              });
            }
          } catch (err) {
            console.error('Failed to sync alarm settings', err);
          }
        })();
      } else if (!settings.jeyukAlert) {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          supabase.rpc('upsert_alarm_subscription', {
            p_device_id: deviceId,
            p_fcm_token: null,
            p_topic: 'CAFETERIA_KEYWORD',
            p_params: null,
            p_is_active: false
          }).then();
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
        className="w-[calc(100%-48px)] max-w-[340px] bg-white rounded-card px-5 pb-6 max-h-[90vh] overflow-y-auto mb-6 relative select-none shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
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
          transition: 'opacity 0.2s',
        }}>
          {/* 1단계: 알림 방식 선택 */}
          <div className="py-2.5 border-b border-[#f1f5f9]">
            <div className="text-[14px] font-extrabold text-text-main mb-2.5">알림 방식 선택</div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${settings.mode === 'cafe'
                  ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                  : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                  }`}
                onClick={async () => {
                  const ok = await ensureJeyukAlertOn();
                  if (ok) setSettings(p => ({ ...p, mode: p.mode === 'cafe' ? null : 'cafe' }));
                }}
              >
                식당별
              </button>
              <button
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${settings.mode === 'keyword'
                  ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                  : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                  }`}
                onClick={async () => {
                  const ok = await ensureJeyukAlertOn();
                  if (ok) setSettings(p => ({ ...p, mode: p.mode === 'keyword' ? null : 'keyword' }));
                }}
              >
                키워드
              </button>
            </div>
            <div className="text-[11px] text-[#64748b] leading-relaxed px-0.5 mt-2">
              {settings.mode === 'cafe'
                ? '선택한 식당의 알림을 받습니다.'
                : settings.mode === 'keyword'
                  ? '키워드가 메뉴에 포함되어 있을 때만 알림을 받습니다.'
                  : '알림을 받아볼 방식을 선택해주세요.'
              }
            </div>
          </div>

          {/* 2단계: 식당 모드 상세 설정 */}
          <div style={{
            opacity: settings.mode === 'cafe' ? 1 : 0,
            transform: settings.mode === 'cafe' ? 'translateY(0)' : 'translateY(16px)',
            maxHeight: settings.mode === 'cafe' ? '200px' : '0px',
            overflow: 'hidden',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: settings.mode === 'cafe' ? 'auto' : 'none',
            marginTop: settings.mode === 'cafe' ? '8px' : '0px',
          }} className={settings.mode === 'cafe' ? "py-2.5 border-b border-[#f1f5f9]" : ""}>
            <div className="text-[14px] font-extrabold text-text-main mb-2.5">알림을 받아볼 식당 선택</div>
            <div className="flex flex-wrap gap-2 items-center">
              {[
                { id: 're12', name: '학생식당' },
                { id: 're15', name: '창업보육센터' },
                { id: 're11', name: '교직원식당' },
                { id: 're13', name: '기숙사식당' }
              ].map(cafe => (
                <button
                  key={cafe.id}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${settings.selectedCafe === cafe.id
                    ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                    : 'bg-white border-[#e2e8f0] text-text-sub hover:border-primary/50'
                    }`}
                  onClick={async () => {
                    const ok = await ensureJeyukAlertOn();
                    if (ok) setSettings(p => ({ ...p, selectedCafe: p.selectedCafe === cafe.id ? null : cafe.id }));
                  }}
                >
                  {cafe.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2단계: 키워드 모드 상세 설정 */}
          <div style={{
            opacity: settings.mode === 'keyword' ? 1 : 0,
            transform: settings.mode === 'keyword' ? 'translateY(0)' : 'translateY(16px)',
            maxHeight: settings.mode === 'keyword' ? '300px' : '0px',
            overflow: 'hidden',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: settings.mode === 'keyword' ? 'auto' : 'none',
            marginTop: settings.mode === 'keyword' ? '8px' : '0px',
          }} className={settings.mode === 'keyword' ? "py-2.5 border-b border-[#f1f5f9]" : ""}>
            <div className="text-[14px] font-extrabold text-text-main mb-1.5">알림 키워드 등록</div>
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 h-10 border-[1.5px] border-[#e2e8f0] rounded-card px-3 text-[14px] text-text-main bg-surface outline-none transition-colors duration-200 focus:border-[#3b82f6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                value={keywordInput}
                onChange={async (e) => {
                  setKeywordInput(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    await ensureJeyukAlertOn();
                  }
                }}
                onKeyDown={e => e.key === 'Enter' && addKeyword()}
                placeholder="예: 제육, 돈까스"
              />
              <button
                className="w-10 h-10 bg-[#3b82f6] text-white border-none rounded-card flex items-center justify-center cursor-pointer flex-shrink-0 transition-opacity duration-150 hover:opacity-[0.88]"
                onClick={addKeyword}
              >
                <Plus size={18} />
              </button>
            </div>
            {settings.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-[88px] overflow-y-auto pr-1 no-scrollbar">
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

          {/* 3단계: 시간 설정 (조건 충족 시 활성화 - 부드럽게 Slide Up & Fade In) */}
          {(() => {
            const isTimePickerActive = (settings.mode === 'cafe' && settings.selectedCafe !== null) || (settings.mode === 'keyword' && settings.keywords.length > 0);
            return (
              <div style={{
                opacity: isTimePickerActive ? 1 : 0,
                transform: isTimePickerActive ? 'translateY(0)' : 'translateY(24px)',
                maxHeight: isTimePickerActive ? '200px' : '0px',
                marginTop: isTimePickerActive ? '16px' : '0px',
                paddingTop: isTimePickerActive ? '4px' : '0px',
                pointerEvents: isTimePickerActive ? 'auto' : 'none',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                <div className="py-1">
                  <div className="text-[14px] font-extrabold text-text-main mb-2">몇 시에 보낼까요?</div>
                  <TimePicker
                    value={settings.notifyTime}
                    onChange={async (t) => {
                      const ok = await ensureJeyukAlertOn();
                      if (ok) setSettings(p => ({ ...p, notifyTime: t }));
                    }}
                    day={settings.notifyDay}
                    onDayChange={async (d) => {
                      const ok = await ensureJeyukAlertOn();
                      if (ok) setSettings(p => ({ ...p, notifyDay: d }));
                    }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
