import { useMemo } from 'react';
import { useAlarmSubscription } from '../../hooks/useAlarmSubscription.js';
import { TimeDayWheelPicker } from '../ui/TimeDayWheelPicker.js';
import { ModalBottomSheet } from '../ui/ModalBottomSheet.js';

interface WeatherConditions {
  daily: boolean;
  weekday: boolean;
  rainSnow: boolean;
  dust: boolean;
  uv: boolean;
}

interface WeatherAlarmParams {
  conditions: WeatherConditions;
  notifyTime: string;
  notifyDay: string;
}

const DEFAULT_PARAMS: WeatherAlarmParams = {
  conditions: { daily: false, weekday: false, rainSnow: false, dust: false, uv: false },
  notifyTime: '08:00',
  notifyDay: '당일'
};

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
  const { enabled, params, setParams, ensureEnabled, toggle, commitOnClose } = useAlarmSubscription<WeatherAlarmParams>({
    topic: 'WEATHER_ALERT',
    storageKey: 'weather_alarm_settings',
    defaultParams: DEFAULT_PARAMS,
    isSubscribed: (enabled) => enabled,
    buildSuccessMessage: () => '🔔 설정한 시간에 맞춰\n날씨 알림을 보내드릴게요',
  });

  // 3단계 영역(날짜 및 시간 선택) 활성화 조건: 2단계 조건이 하나라도 켜져 있는가
  const isStep3Active = params.conditions.daily ||
                        params.conditions.weekday ||
                        params.conditions.rainSnow ||
                        params.conditions.dust ||
                        params.conditions.uv;

  // 매일/평일(Group A)과 상세 기상 조건(Group B)의 배타적 스타일 적용을 위한 판별 변수
  const isGroupAActive = params.conditions.daily || params.conditions.weekday;
  const isGroupBActive = params.conditions.rainSnow || params.conditions.dust || params.conditions.uv;

  // 동적 안내 설명 문구 계산 (React Element 형태 반환)
  const guideElement = useMemo(() => {
    if (params.conditions.daily) {
      return (
        <span>
          <span className="font-extrabold">매일</span> 알림으로 날씨를 알려드릴게요.
        </span>
      );
    }

    if (params.conditions.weekday) {
      return (
        <span>
          <span className="font-extrabold">평일</span> 알림으로 날씨를 알려드릴게요.
        </span>
      );
    }

    const activeConditions: string[] = [];
    if (params.conditions.rainSnow) activeConditions.push('비/눈이 오는 날');
    if (params.conditions.dust) activeConditions.push('미세먼지가 나쁜 날');
    if (params.conditions.uv) activeConditions.push('자외선 지수가 높은 날');

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
  }, [params.conditions]);

  // 조건 칩 클릭 제약 처리
  const handleConditionToggle = async (key: keyof WeatherConditions) => {
    const ok = await ensureEnabled();
    if (!ok) return;

    setParams(prev => {
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
    <ModalBottomSheet
      onRequestClose={commitOnClose}
      onClose={onClose}
      className="w-[calc(100%-48px)] max-w-[340px] rounded-card rounded-b-none px-5 pb-[calc(24px+env(safe-area-inset-bottom))] mb-0 no-scrollbar"
      scrollExemptSelector=".alarm-picker-scroll"
    >
      {/* 1단계: 타이틀 및 온오프 스위치 */}
      <div className="flex items-center justify-between py-3.5 pb-2.5 border-b border-[#f1f5f9] mb-4">
        <span className="text-[18px] font-extrabold text-text-main leading-none">날씨 알림설정</span>
        <label className="alarm-toggle" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          <input type="checkbox" checked={enabled} onChange={toggle} />
          <span className="alarm-toggle-slider" />
        </label>
      </div>

      <div style={{
        opacity: enabled ? 1 : 0.35,
        transition: 'opacity 0.2s',
      }}>

        {/* 2단계: 이럴 때 알림을 보내주세요 */}
        <div className="mb-5">
          <div className="text-[14px] font-extrabold text-text-main mb-2.5">이럴 때 알림을 보내주세요</div>
          <div className="flex flex-wrap gap-2 items-center">
            {CONDITION_CHIPS.map(({ key, label, group }) => {
              const isActive = params.conditions[key];
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
              value={params.notifyTime}
              onChange={async (t) => {
                const ok = await ensureEnabled();
                if (ok) setParams(p => ({ ...p, notifyTime: t }));
              }}
              day={params.notifyDay}
              onDayChange={async (d) => {
                const ok = await ensureEnabled();
                if (ok) setParams(p => ({ ...p, notifyDay: d }));
              }}
            />
          </div>
        </div>

      </div>
    </ModalBottomSheet>
  );
}
