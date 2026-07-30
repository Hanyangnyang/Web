import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { requestNotificationPermission, checkNotificationPermission } from '../../../lib/firebase.js';
import { supabase } from '../../../lib/supabase.js';
import { getPlatform } from '../../../lib/platform.js';
import { TimeDayWheelPicker, DAY_LIST } from '../ui/TimeDayWheelPicker.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';

interface WeatherConditions {
  daily: boolean;
  weekday: boolean;
  rainSnow: boolean;
  dust: boolean;
  uv: boolean;
}

interface AlarmSettingsState {
  weatherAlert: boolean;
  conditions: WeatherConditions;
  notifyTime: string;
  notifyDay: string;
}

const DEFAULT_SETTINGS: AlarmSettingsState = {
  weatherAlert: false,
  conditions: { daily: false, weekday: false, rainSnow: false, dust: false, uv: false },
  notifyTime: '08:00',
  notifyDay: '당일'
};

const cloneDefaultSettings = (): AlarmSettingsState => ({
  ...DEFAULT_SETTINGS,
  conditions: { ...DEFAULT_SETTINGS.conditions },
});

const loadSettings = (): AlarmSettingsState => {
  try {
    const saved = localStorage.getItem('weather_alarm_settings');
    if (!saved) return cloneDefaultSettings();
    const parsed = JSON.parse(saved) as Partial<AlarmSettingsState>;

    // 시간 검증
    if (parsed.notifyTime) {
      const h = parseInt(parsed.notifyTime.split(':')[0]);
      if (isNaN(h) || h < 0 || h > 23) parsed.notifyTime = '08:00';
    }
    if (!parsed.notifyDay || !DAY_LIST.includes(parsed.notifyDay)) parsed.notifyDay = '당일';

    // 조건 칩 기본 값 구조 유지 검증
    parsed.conditions = { ...DEFAULT_SETTINGS.conditions, ...parsed.conditions };

    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return cloneDefaultSettings();
  }
};

const settingsEqual = (a: AlarmSettingsState, b: AlarmSettingsState) =>
  a.weatherAlert === b.weatherAlert &&
  a.notifyTime === b.notifyTime &&
  a.notifyDay === b.notifyDay &&
  JSON.stringify(a.conditions) === JSON.stringify(b.conditions);

async function getOrCreateSecureDeviceId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    return session.user.id;
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.session) throw new Error('Failed to create anonymous session');
  return data.session.user.id;
}

// 조건 칩: group A(매일/평일)와 group B(비눈/미세먼지/자외선)는 서로 배타적이라
// 한쪽이 켜지면 반대쪽 그룹 칩은 흐리게(dimmed) 표시
const CONDITION_CHIPS: { key: keyof WeatherConditions; label: string; group: 'A' | 'B' }[] = [
  { key: 'daily', label: '매일', group: 'A' },
  { key: 'weekday', label: '평일', group: 'A' },
  { key: 'rainSnow', label: '비/눈', group: 'B' },
  { key: 'dust', label: '미세먼지', group: 'B' },
  { key: 'uv', label: '자외선', group: 'B' },
];

export interface WeatherAlarmSettingsProps {
  onClose: (message?: string) => void;
}

export function WeatherAlarmSettings({ onClose }: WeatherAlarmSettingsProps) {
  const savedRef = useRef<AlarmSettingsState>(loadSettings());
  const [settings, setSettings] = useState<AlarmSettingsState>(() => ({ ...savedRef.current }));
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const backdropRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isDirty = !settingsEqual(settings, savedRef.current);

  // 3단계 영역(날짜 및 시간 선택) 활성화 조건: 2단계 조건이 하나라도 켜져 있는가
  const isStep3Active = settings.conditions.daily ||
                        settings.conditions.weekday ||
                        settings.conditions.rainSnow ||
                        settings.conditions.dust ||
                        settings.conditions.uv;

  // 매일/평일(Group A)과 상세 기상 조건(Group B)의 배타적 스타일 적용을 위한 판별 변수
  const isGroupAActive = settings.conditions.daily || settings.conditions.weekday;
  const isGroupBActive = settings.conditions.rainSnow || settings.conditions.dust || settings.conditions.uv;

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

    const activeConditions: string[] = [];
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

  // iOS 배경 스크롤 잠금 (position:fixed 대신 클래스 토글로 레이아웃 점프 방지)
  useEffect(() => {
    document.documentElement.classList.add('scroll-locked');
    document.body.classList.add('scroll-locked');
    return () => {
      document.documentElement.classList.remove('scroll-locked');
      document.body.classList.remove('scroll-locked');
    };
  }, []);

  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('.alarm-picker-scroll')) e.preventDefault();
    };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  useEffect(() => {
    async function syncWithServer() {
      try {
        const deviceId = await getOrCreateSecureDeviceId();
        const { data, error } = await supabase.rpc('get_alarm_subscription', {
          p_device_id: deviceId,
          p_topic: 'WEATHER_ALERT'
        });
        if (data && !error) {
          const newSettings: AlarmSettingsState = {
            weatherAlert: data.is_active,
            conditions: data.params?.conditions || { daily: false, weekday: false, rainSnow: false, dust: false, uv: false },
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

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>) => {
    if (sheetRef.current && sheetRef.current.scrollTop > 0) return;
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
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
      const hasPerm = await checkNotificationPermission();
      if (!hasPerm) {
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
      const hasPerm = await checkNotificationPermission();
      if (!hasPerm) {
        alert('알림 권한을 허용해야 기능을 사용할 수 있습니다.');
        setSettings(p => ({ ...p, weatherAlert: false }));
      }
    }
  };

  const triggerClose = (msg?: string) => {
    setClosing(true);
    setTimeout(() => onClose(msg), 250);
  };

  const handleClose = () => {
    let successMsg: string | undefined;
    if (isDirty) {
      localStorage.setItem('weather_alarm_settings', JSON.stringify(settings));

      if (settings.weatherAlert) {
        successMsg = '🔔 설정한 시간에 맞춰\n날씨 알림을 보내드릴게요';

        (async () => {
          try {
            const token = await requestNotificationPermission();
            if (token) {
              const deviceId = await getOrCreateSecureDeviceId();
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
                p_platform: getPlatform(),
              });
            }
          } catch (err) {
            console.error('Failed to sync weather alarm settings', err);
          }
        })();
      } else {
        (async () => {
          try {
            const deviceId = await getOrCreateSecureDeviceId();
            await supabase.rpc('upsert_alarm_subscription', {
              p_device_id: deviceId,
              p_fcm_token: null,
              p_topic: 'WEATHER_ALERT',
              p_params: null,
              p_is_active: false,
              p_platform: getPlatform(),
            });
          } catch (err) {
            console.error('Failed to sync weather alarm status', err);
          }
        })();
      }
    }
    triggerClose(successMsg);
  };

  // 안드로이드 하드웨어 뒤로가기를 눌렀을 때 앱 종료 대신 시트 닫기(닫기 버튼과 동일 동작)
  useBackHandler(handleClose);

  // 조건 칩 클릭 제약 처리
  const handleConditionToggle = async (key: keyof WeatherConditions) => {
    const ok = await ensureWeatherAlertOn();
    if (!ok) return;

    setSettings(prev => {
      const nextConditions = { ...prev.conditions };
      if (key === 'daily') {
        const nextVal = !nextConditions.daily;
        // '매일' 선택 시 다른 모든 조건은 해제
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
        // '평일' 선택 시 다른 모든 조건은 해제
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
        const nextVal = !nextConditions[key];
        if (nextVal) {
          // 비/눈, 미세먼지, 자외선 중 하나가 선택되면 매일/평일은 자동 해제 (배타적 선택)
          nextConditions.daily = false;
          nextConditions.weekday = false;
        }
        nextConditions[key] = nextVal;
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
        className="w-[calc(100%-48px)] max-w-[340px] bg-white rounded-card rounded-b-none px-5 pb-[calc(24px+env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto mb-0 relative select-none shadow-[0_8px_32px_rgba(0,0,0,0.12)] no-scrollbar"
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
              {CONDITION_CHIPS.map(({ key, label, group }) => {
                const isActive = settings.conditions[key];
                const isDimmed = group === 'A' ? isGroupBActive : isGroupAActive;
                return (
                  <button
                    key={key}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-[0_2px_8px_rgba(14,74,132,0.18)]'
                        : isDimmed
                          ? 'bg-slate-50 text-slate-400 border-slate-200/80 opacity-60 hover:bg-slate-100/80'
                          : 'bg-white text-text-sub border-[#e2e8f0] hover:bg-slate-50'
                    }`}
                    onClick={() => handleConditionToggle(key)}
                  >
                    {label}
                  </button>
                );
              })}
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
              <TimeDayWheelPicker
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
