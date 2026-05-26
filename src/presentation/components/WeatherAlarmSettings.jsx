import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { requestNotificationPermission } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

// 한글 받침 유무에 따라 조사를 자연스럽게 변환하는 유틸리티
const josa = (word, type) => {
  if (!word) return '';
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) return word;
  const hasBatchim = (lastChar - 0xAC00) % 28 !== 0;
  
  if (type === '이/가') return hasBatchim ? `${word}이` : `${word}가`;
  if (type === '을/를') return hasBatchim ? `${word}을` : `${word}를`;
  if (type === '와/과') return hasBatchim ? `${word}과` : `${word}와`;
  return word;
};

const ITEM_H = 36;
const VISIBLE = 3;

const HOUR_LIST = Array.from({ length: 12 }, (_, i) => i);
const AMPM_LIST = ['오전', '오후'];
const DAY_LIST = ['전날', '당일'];

const parseH24 = (h24) => ({
  displayHour: h24 % 12,
  ampmIdx:     h24 < 12 ? 0 : 1,
});

const toH24 = (displayHour, ampmIdx) => ampmIdx === 0 ? displayHour : displayHour + 12;

function TimePicker({ value, onChange, day, onDayChange }) {
  const h24     = Math.max(0, Math.min(parseInt(value.split(':')[0]) || 0, 23));
  const initDay = Math.max(0, DAY_LIST.indexOf(day));
  const { displayHour: initHour, ampmIdx: initAmpm } = parseH24(h24);

  const [liveHour, setLiveHour] = useState(initHour);
  const [liveAmpm, setLiveAmpm] = useState(initAmpm);
  const [liveDay,  setLiveDay]  = useState(initDay);

  const hourRef = useRef(null);
  const ampmRef = useRef(null);
  const dayRef  = useRef(null);
  const hourTimer = useRef(null);
  const ampmTimer = useRef(null);
  const dayTimer  = useRef(null);
  
  const hourWheelCooldown = useRef(false);
  const ampmWheelCooldown = useRef(false);
  const dayWheelCooldown = useRef(false);

  useLayoutEffect(() => {
    if (hourRef.current) hourRef.current.scrollTop = initHour * ITEM_H;
    if (ampmRef.current) ampmRef.current.scrollTop = initAmpm * ITEM_H;
    if (dayRef.current)  dayRef.current.scrollTop  = initDay  * ITEM_H;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { displayHour, ampmIdx } = parseH24(h24);
    setLiveHour(displayHour);
    setLiveAmpm(ampmIdx);
  }, [h24]);

  useEffect(() => {
    setLiveDay(initDay);
  }, [initDay]);

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

  const handleDragScroll = (ref) => {
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
      const walk = (y - startY) * 1.2;
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

      <div
        ref={dayRef}
        onScroll={handleDayScroll}
        onWheel={handleDayWheel}
        {...handleDragScroll(dayRef)}
        className="alarm-picker-scroll"
        style={colStyle(64)}
      >
        <div style={{ height: ITEM_H }} />
        {DAY_LIST.map((opt, idx) => (
          <div key={opt} style={itemStyle(idx === liveDay)}>{opt}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      <div
        ref={ampmRef}
        onScroll={handleAmpmScroll}
        onWheel={handleAmpmWheel}
        {...handleDragScroll(ampmRef)}
        className="alarm-picker-scroll"
        style={colStyle(56)}
      >
        <div style={{ height: ITEM_H }} />
        {AMPM_LIST.map((opt, idx) => (
          <div key={opt} style={itemStyle(idx === liveAmpm)}>{opt}</div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>

      <div
        ref={hourRef}
        onScroll={handleHourScroll}
        onWheel={handleHourWheel}
        {...handleDragScroll(hourRef)}
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
    const saved = localStorage.getItem('weather_alarm_settings');
    const defaultVal = {
      weatherAlert: false,
      conditions: { daily: false, weekday: false, rainSnow: false, dust: false, uv: false },
      notifyTime: '08:00',
      notifyDay: '당일'
    };
    if (!saved) return defaultVal;
    const parsed = JSON.parse(saved);
    
    // 시간 검증
    if (parsed.notifyTime) {
      const h = parseInt(parsed.notifyTime.split(':')[0]);
      if (isNaN(h) || h < 0 || h > 23) parsed.notifyTime = '08:00';
    }
    if (!DAY_LIST.includes(parsed.notifyDay)) parsed.notifyDay = '당일';
    
    // 조건 칩 기본 값 구조 유지 검증
    parsed.conditions = { ...defaultVal.conditions, ...parsed.conditions };
    
    return { ...defaultVal, ...parsed };
  } catch {
    return {
      weatherAlert: false,
      conditions: { daily: false, weekday: false, rainSnow: false, dust: false, uv: false },
      notifyTime: '08:00',
      notifyDay: '당일'
    };
  }
};

const settingsEqual = (a, b) =>
  a.weatherAlert === b.weatherAlert &&
  a.notifyTime === b.notifyTime &&
  a.notifyDay === b.notifyDay &&
  JSON.stringify(a.conditions) === JSON.stringify(b.conditions);

export function WeatherAlarmSettings({ onClose }) {
  const savedRef = useRef(loadSettings());
  const [settings, setSettings] = useState(() => ({ ...savedRef.current }));
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const backdropRef = useRef(null);
  const sheetRef = useRef(null);

  const isDirty = !settingsEqual(settings, savedRef.current);

  // 3단계 영역(날짜 및 시간 선택) 활성화 조건: 2단계 조건이 하나라도 켜져 있는가
  const isStep3Active = settings.conditions.daily ||
                        settings.conditions.weekday ||
                        settings.conditions.rainSnow ||
                        settings.conditions.dust ||
                        settings.conditions.uv;

  // 동적 안내 설명 문구 계산 (React Element 형태 반환)
  const guideElement = useMemo(() => {
    if (settings.conditions.daily) {
      return (
        <span>
          <span className="font-extrabold">매일</span> 알림으로 날씨를 알려드릴게요.
        </span>
      );
    }

    if (settings.conditions.weekday) {
      return (
        <span>
          <span className="font-extrabold">평일</span> 알림으로 날씨를 알려드릴게요.
        </span>
      );
    }
    
    const activeConditions = [];
    if (settings.conditions.rainSnow) activeConditions.push('비/눈이 오는 날');
    if (settings.conditions.dust) activeConditions.push('미세먼지가 나쁜 날');
    if (settings.conditions.uv) activeConditions.push('자외선 지수가 높은 날');
    
    if (activeConditions.length > 0) {
      return (
        <span>
          {activeConditions.map((cond, idx) => (
            <span key={cond}>
              {idx > 0 && <span>, </span>}
              <span className="font-extrabold">{cond}</span>
            </span>
          ))}
          <span>에 알림을 보내드릴게요</span>
        </span>
      );
    }
    
    return null;
  }, [settings.conditions]);

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

  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const prevent = (e) => {
      if (!e.target.closest('.alarm-picker-scroll')) e.preventDefault();
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  useEffect(() => {
    async function syncWithServer() {
      const deviceId = localStorage.getItem('device_id');
      if (!deviceId) return;
      try {
        const { data, error } = await supabase.rpc('get_alarm_subscription', {
          p_device_id: deviceId,
          p_topic: 'WEATHER_ALERT'
        });
        if (data && !error) {
          const newSettings = {
            weatherAlert: data.is_active,
            conditions: data.params?.conditions || { daily: false, rainSnow: false, dust: false, uv: false },
            notifyTime: data.params?.notifyTime || '08:00',
            notifyDay: data.params?.notifyDay || '당일',
          };
          setSettings(newSettings);
          savedRef.current = newSettings;
          localStorage.setItem('weather_alarm_settings', JSON.stringify(newSettings));
        }
      } catch (err) {
        console.error('Failed to sync weather alarm settings', err);
      }
    }
    syncWithServer();
  }, []);

  const handleTouchStart = (e) => {
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return;
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY.current;
    if (deltaY > 0) {
      if (e.cancelable) e.preventDefault();
      setDragY(deltaY);
    } else {
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

  const ensureWeatherAlertOn = async () => {
    if (!settings.weatherAlert) {
      const token = await requestNotificationPermission();
      if (!token) {
        alert('알림 권한을 허용해야 기능을 사용할 수 있습니다.');
        return false;
      }
      setSettings(prev => ({ ...prev, weatherAlert: true }));
    }
    return true;
  };

  const toggle = async () => {
    const turningOn = !settings.weatherAlert;
    setSettings(p => ({ ...p, weatherAlert: turningOn }));
    if (turningOn) {
      const token = await requestNotificationPermission();
      if (!token) {
        alert('알림 권한을 허용해야 기능을 사용할 수 있습니다.');
        setSettings(p => ({ ...p, weatherAlert: false }));
      }
    }
  };

  const triggerClose = (msg) => {
    setClosing(true);
    setTimeout(() => onClose(msg), 250);
  };

  const handleClose = () => {
    let successMsg;
    if (isDirty) {
      localStorage.setItem('weather_alarm_settings', JSON.stringify(settings));

      if (settings.weatherAlert) {
        // 동적 완성형 팝업 완료 메시지 조립
        if (settings.conditions.daily || settings.conditions.weekday) {
          successMsg = '설정한 시간에 맞춰\n날씨 알림을 보내드릴게요';
        } else {
          const activeKeywords = [];
          if (settings.conditions.rainSnow) activeKeywords.push('비/눈 소식');
          if (settings.conditions.dust) activeKeywords.push('탁한 공기');
          if (settings.conditions.uv) activeKeywords.push('강한 자외선 소식');

          if (activeKeywords.length > 0) {
            let joined = '';
            if (activeKeywords.length === 3) {
              joined = `${activeKeywords[0]}, ${activeKeywords[1]}, 그리고 ${activeKeywords[2]}`;
            } else if (activeKeywords.length === 2) {
              // 한글 '비/눈 소식'은 받침이 없으므로 '과' 조사로 유기적 매치
              joined = `${activeKeywords[0]}과 ${activeKeywords[1]}`;
            } else {
              joined = activeKeywords[0];
            }
            const josaJoined = josa(joined, '이/가');
            successMsg = '설정한 시간에 맞춰\n날씨 알림을 보내드릴게요';
          } else {
            successMsg = '설정한 시간에 맞춰\n날씨 알림을 보내드릴게요';
          }
        }

        (async () => {
          try {
            const token = await requestNotificationPermission();
            if (token) {
              let deviceId = localStorage.getItem('device_id');
              if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem('device_id', deviceId);
              }
              await supabase.rpc('upsert_alarm_subscription', {
                p_device_id: deviceId,
                p_fcm_token: token,
                p_topic: 'WEATHER_ALERT',
                p_params: {
                  conditions: settings.conditions,
                  notifyTime: settings.notifyTime,
                  notifyDay: settings.notifyDay
                },
                p_is_active: true,
              });
            }
          } catch (err) {
            console.error('Failed to sync weather alarm settings', err);
          }
        })();
      } else {
        const deviceId = localStorage.getItem('device_id');
        if (deviceId) {
          supabase.rpc('upsert_alarm_subscription', {
            p_device_id: deviceId,
            p_fcm_token: null,
            p_topic: 'WEATHER_ALERT',
            p_params: null,
            p_is_active: false,
          }).then();
        }
      }
    }
    triggerClose(successMsg);
  };

  // 조건 칩 클릭 제약 처리
  const handleConditionToggle = async (key) => {
    const ok = await ensureWeatherAlertOn();
    if (!ok) return;

    setSettings(prev => {
      const nextConditions = { ...prev.conditions };
      if (key === 'daily') {
        const nextVal = !nextConditions.daily;
        // '매일' 선택 시 다른 칩들은 모두 꺼지고 비활성화
        return {
          ...prev,
          conditions: {
            daily: nextVal,
            weekday: false,
            rainSnow: false,
            dust: false,
            uv: false
          }
        };
      } else if (key === 'weekday') {
        const nextVal = !nextConditions.weekday;
        // '평일' 선택 시 다른 칩들은 모두 꺼지고 비활성화
        return {
          ...prev,
          conditions: {
            daily: false,
            weekday: nextVal,
            rainSnow: false,
            dust: false,
            uv: false
          }
        };
      } else {
        // 비/눈, 미세먼지, 자외선은 중복 선택 가능
        nextConditions[key] = !nextConditions[key];
        return {
          ...prev,
          conditions: nextConditions
        };
      }
    });
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
        className="w-[calc(100%-48px)] max-w-[340px] bg-white rounded-card px-5 pb-6 max-h-[90vh] overflow-y-auto mb-6 relative select-none shadow-[0_8px_32px_rgba(0,0,0,0.12)] no-scrollbar"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: closing ? 'sheetDown 0.25s cubic-bezier(0.4, 0, 1, 1) forwards' : 'sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
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

        {/* 1단계: 타이틀 및 온오프 스위치 */}
        <div className="flex items-center justify-between py-3.5 pb-2.5 border-b border-[#f1f5f9] mb-4">
          <span className="text-[18px] font-extrabold text-text-main leading-none">날씨 알림설정</span>
          <label className="alarm-toggle" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <input type="checkbox" checked={settings.weatherAlert} onChange={toggle} />
            <span className="alarm-toggle-slider" />
          </label>
        </div>

        <div style={{
          opacity: settings.weatherAlert ? 1 : 0.35,
          transition: 'opacity 0.2s',
        }}>
          
          {/* 2단계: 이럴 때 알림을 보내주세요 */}
          <div className="mb-5">
            <div className="text-[14px] font-extrabold text-text-main mb-2.5">이럴 때 알림을 보내주세요</div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                  settings.conditions.daily
                    ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                    : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                }`}
                onClick={() => handleConditionToggle('daily')}
              >
                매일
              </button>

              <button
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                  settings.conditions.weekday
                    ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                    : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                }`}
                onClick={() => handleConditionToggle('weekday')}
              >
                평일
              </button>
              
              <button
                disabled={settings.conditions.daily || settings.conditions.weekday}
                style={{
                  opacity: (settings.conditions.daily || settings.conditions.weekday) ? 0 : 1,
                  transform: (settings.conditions.daily || settings.conditions.weekday) ? 'scale(0.7) translateY(-4px)' : 'scale(1) translateY(0)',
                  maxWidth: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '150px',
                  margin: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '',
                  paddingLeft: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '14px',
                  paddingRight: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '14px',
                  paddingTop: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '6px',
                  paddingBottom: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '6px',
                  borderWidth: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '1px',
                  pointerEvents: (settings.conditions.daily || settings.conditions.weekday) ? 'none' : 'auto',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className={`rounded-full text-xs font-bold border ${
                  settings.conditions.rainSnow
                    ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                    : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                }`}
                onClick={() => handleConditionToggle('rainSnow')}
              >
                비/눈
              </button>

              <button
                disabled={settings.conditions.daily || settings.conditions.weekday}
                style={{
                  opacity: (settings.conditions.daily || settings.conditions.weekday) ? 0 : 1,
                  transform: (settings.conditions.daily || settings.conditions.weekday) ? 'scale(0.7) translateY(-4px)' : 'scale(1) translateY(0)',
                  maxWidth: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '150px',
                  margin: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '',
                  paddingLeft: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '14px',
                  paddingRight: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '14px',
                  paddingTop: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '6px',
                  paddingBottom: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '6px',
                  borderWidth: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '1px',
                  pointerEvents: (settings.conditions.daily || settings.conditions.weekday) ? 'none' : 'auto',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className={`rounded-full text-xs font-bold border ${
                  settings.conditions.dust
                    ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                    : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                }`}
                onClick={() => handleConditionToggle('dust')}
              >
                미세먼지
              </button>

              <button
                disabled={settings.conditions.daily || settings.conditions.weekday}
                style={{
                  opacity: (settings.conditions.daily || settings.conditions.weekday) ? 0 : 1,
                  transform: (settings.conditions.daily || settings.conditions.weekday) ? 'scale(0.7) translateY(-4px)' : 'scale(1) translateY(0)',
                  maxWidth: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '150px',
                  margin: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '',
                  paddingLeft: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '14px',
                  paddingRight: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '14px',
                  paddingTop: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '6px',
                  paddingBottom: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '6px',
                  borderWidth: (settings.conditions.daily || settings.conditions.weekday) ? '0px' : '1px',
                  pointerEvents: (settings.conditions.daily || settings.conditions.weekday) ? 'none' : 'auto',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className={`rounded-full text-xs font-bold border ${
                  settings.conditions.uv
                    ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                    : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                }`}
                onClick={() => handleConditionToggle('uv')}
              >
                자외선
              </button>
            </div>
            {guideElement && (
              <div className="mt-3 px-1 text-[12px] font-medium text-text-sub leading-relaxed transition-all duration-300 animate-[fadeIn_0.2s_ease]">
                {guideElement}
              </div>
            )}
          </div>

          {/* 3단계: 날짜 및 시간 설정 (조건 선택 시 활성화 - 부드럽게 Slide Up & Fade In) */}
          <div style={{
            opacity: isStep3Active ? 1 : 0,
            transform: isStep3Active ? 'translateY(0)' : 'translateY(24px)',
            maxHeight: isStep3Active ? '200px' : '0px',
            marginTop: isStep3Active ? '20px' : '0px',
            paddingTop: isStep3Active ? '4px' : '0px',
            pointerEvents: isStep3Active ? 'auto' : 'none',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* 시간 선택 */}
            <div className="py-1">
              <div className="text-[14px] font-extrabold text-text-main mb-2">몇 시에 보낼까요?</div>
              <TimePicker
                value={settings.notifyTime}
                onChange={async (t) => {
                  const ok = await ensureWeatherAlertOn();
                  if (ok) setSettings(p => ({ ...p, notifyTime: t }));
                }}
                day={settings.notifyDay}
                onDayChange={async (d) => {
                  const ok = await ensureWeatherAlertOn();
                  if (ok) setSettings(p => ({ ...p, notifyDay: d }));
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
