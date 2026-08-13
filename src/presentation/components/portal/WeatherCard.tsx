import React, { useMemo } from 'react';
import { Sparkles, Wind, Sun, WifiOff } from 'lucide-react';
import type { Weather, WeatherCondition } from '../../../domain/entities/Weather.js';
import type { WeatherBriefing } from '../../../domain/entities/WeatherBriefing.js';
import { TypewriterText } from './TypewriterText.js';
import {
  getHourlyIcon,
  getHourlyIconFill,
  getWeatherTheme,
  CONDITION_LABEL,
  UNKNOWN_CONDITION_LABEL,
  PM_COLOR,
  UV_COLOR,
  UNKNOWN_GRADE_LABEL,
  UNKNOWN_GRADE_COLOR,
} from './weatherTheme.js';
import { useNow } from '../../hooks/useNow.js';

const COLD_SNAP_TEMP = -10;     // 한파 판단 기준 기온(℃)
const HOUR = 60 * 60 * 1000;
const FORECAST_HOURS = 12;      // 지금 시각이 속한 칸부터 앞으로 몇 시간을 보여줄지

interface WeatherCardProps {
  weather: Weather | null;
  loading: boolean;
  isVisible?: boolean;
  briefing?: WeatherBriefing | null;
  error?: Error | null;
}

interface RenderedForecastItem {
  epoch: number;
  hour: number;
  temp: number;
  condition: WeatherCondition | null;
  isCurrent: boolean;
}

function Notice({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-slate-200 bg-white min-h-[180px] flex flex-col items-center justify-center gap-2 shadow-sm opacity-80">
      <WifiOff size={20} className="text-text-hint" />
      <p className="text-center text-text-sub text-sm font-semibold">{message}</p>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="rounded-card p-4 min-h-[180px] bg-slate-100 animate-pulse flex flex-col justify-start">
      <div className="pl-2">
        <div className="h-3 w-20 bg-slate-200 rounded-full" />
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <div className="h-12 w-24 bg-slate-200 rounded-xl" />
          <div className="h-5 w-14 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-3 w-24 bg-slate-200 rounded-full mt-2" />
      </div>
      <div className="mt-2 bg-slate-200/60 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-full bg-slate-200 rounded-full" />
          <div className="h-3 w-2/3 bg-slate-200 rounded-full" />
        </div>
        <div className="border-t border-slate-200/60 w-full" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 py-0.5 flex-shrink-0" style={{ minWidth: '48px' }}>
              <div className="h-[11px] w-5 bg-slate-200 rounded-full" />
              <div className="h-[18px] w-[18px] bg-slate-200 rounded-full my-0.5" />
              <div className="h-[14px] w-5 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200/60 w-full pt-3">
          <div className="flex justify-around items-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 w-10 bg-slate-200 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 소식탭 날씨 박스: weather를 props로만 받는 순수 표시 컴포넌트 (Storybook 대응)
export function WeatherCard({ weather, loading, isVisible = true, briefing = null, error = null }: WeatherCardProps) {
  const nowEpoch = useNow(isVisible);
  const current = weather?.current ?? null;

  // 아래 useMemo 안에서 weather.current를 직접 읽으면 React Compiler가 .current를 ref 접근으로
  // 오해해 의존성 추론이 어긋난다. 필요한 값만 미리 꺼내 쓴다.
  const hourly = weather?.hourly;
  const currentTemp = current?.temp;

  const renderedHourlyForecast = useMemo((): RenderedForecastItem[] => {
    if (!hourly || currentTemp === undefined) return [];

    // 지금이 속한 정각 칸(=최근 1시간 안)부터 앞으로 12시간.
    // 시각 계산은 서버가 준 시(hour)가 아니라 epoch으로만 한다 — 예전에 서버 hour가 UTC로
    // 오염돼 시간대가 밀린 적이 있어서, 절대시각에서 매번 다시 뽑는다.
    const from = nowEpoch - HOUR;
    const to = nowEpoch + FORECAST_HOURS * HOUR;

    return hourly
      .filter(item => item.epoch > from && item.epoch <= to)
      .map(item => {
        // 필터를 통과한 것 중 이미 지난 칸은 '지금'뿐이다
        const isCurrent = item.epoch <= nowEpoch;
        return {
          epoch: item.epoch,
          hour: new Date(item.epoch).getHours(),
          // 강조된 칸은 위의 큰 숫자와 같은 값을 보여줘야 어색하지 않다
          temp: isCurrent ? currentTemp : item.temp,
          condition: item.condition,
          isCurrent,
        };
      });
  }, [hourly, currentTemp, nowEpoch]);

  const weatherTheme = useMemo(() => getWeatherTheme(weather), [weather]);

  // 1. 첫 로딩 — 스켈레톤
  if (loading) {
    return <section className="-mt-3"><WeatherSkeleton /></section>;
  }

  // 2. 조회 실패 — 캐시된 이전 데이터도 없을 때만. 있으면 그걸 계속 보여준다(아래 4번).
  if (error && !current) {
    return <section className="-mt-3"><Notice message="날씨 정보를 불러오지 못했습니다" /></section>;
  }

  // 3. 아직 아무것도 못 받음 — 실패도 아니므로 자리를 비워둔다
  if (!current) return null;

  // 4. 정상
  const airQuality = [
    {
      label: '미세',
      text: current.pm10Grade ?? UNKNOWN_GRADE_LABEL,
      color: current.pm10Grade ? PM_COLOR[current.pm10Grade] : UNKNOWN_GRADE_COLOR,
      Icon: Wind,
    },
    {
      label: '초미세',
      text: current.pm25Grade ?? UNKNOWN_GRADE_LABEL,
      color: current.pm25Grade ? PM_COLOR[current.pm25Grade] : UNKNOWN_GRADE_COLOR,
      Icon: Wind,
    },
    {
      label: '자외선',
      text: current.uvGrade,
      color: UV_COLOR[current.uvGrade],
      Icon: Sun,
    },
  ];

  return (
    <section className="-mt-3">
      <div className="rounded-card p-4 text-white relative overflow-hidden min-h-[180px] flex flex-col justify-start shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300" style={{
        background: weatherTheme.bg
      }}>
        <div className="relative z-10 w-full">
          <div className="flex flex-col w-full">
            {/* 배경 그라데이션 밝기와 무관하게 항상 읽히도록 은은한 텍스트 그림자 사용
                (아래 날씨 변화 박스의 "그림자로 지지되는 흰 텍스트"와 동일한 톤) */}
            <div className="pl-2 [text-shadow:0_1px_1px_rgba(0,0,0,0.3)]">
              <p className="text-xs font-semibold opacity-85 leading-tight">
                안산시 상록구 사동
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-tight leading-none">{current.temp}°</span>
                {/* 설명 텍스트와 한파 뱃지는 기준선이 아닌 수평 중앙선을 기준으로 나란히 정렬 */}
                <span className="inline-flex items-center gap-1">
                  <span className="text-lg font-bold opacity-90 leading-tight">
                    {current.condition ? CONDITION_LABEL[current.condition] : UNKNOWN_CONDITION_LABEL}
                  </span>
                  {current.temp <= COLD_SNAP_TEMP && (
                    <span className="px-1 py-0.5 rounded-full bg-white/25 text-white/80 text-[10px] font-bold tracking-tight">
                      한파
                    </span>
                  )}
                </span>
              </div>
              {current.maxTemp !== null && current.minTemp !== null && (
                <p className="text-xs font-bold opacity-85 leading-tight mt-0.5 flex items-center gap-1">
                  <span>최고 {current.maxTemp}°</span>
                  <span>최저 {current.minTemp}°</span>
                </p>
              )}
            </div>

            {/* 날씨 변화 박스 (AI 브리핑 + 시간별 예보 통합 카드): 배경 그라데이션 밝기와 무관하게
                흰 텍스트 대비를 확보하기 위해 반투명 검정 오버레이 사용 (기존 bg-white/10은
                밝은 배경일수록 대비가 무너졌음). 자세히 들여다보지 않는 보조 정보라 /28 정도로만 살짝. */}
            <div className="mt-2 bg-slate-900/28 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2">
              {/* 브리핑은 날씨와 따로 도착한다. 늦게 오면 그때 문구만 나타나고, 없으면 이 줄 자체가 빠진다. */}
              {briefing && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start text-xs font-bold leading-normal w-full opacity-90 px-0.5">
                    <Sparkles size={14} className="mr-1.5 mt-[2px] flex-shrink-0 text-white/80" />
                    <span className="break-all flex-1">
                      <TypewriterText text={briefing.content} isVisible={isVisible} />
                    </span>
                  </div>
                  <div className="border-t border-white/10 w-full" />
                </div>
              )}

              {/* 시간별 예보 스트립 (지금부터 앞으로 12시간) */}
              {renderedHourlyForecast.length > 0 && (
                <div className="w-full overflow-x-auto no-scrollbar">
                  <div className="flex w-full" style={{ minWidth: 'max-content', padding: '1px 0' }}>
                    {renderedHourlyForecast.map((h) => {
                      const HourlyIcon = getHourlyIcon(h.condition, h.hour);
                      return (
                        <div
                          key={h.epoch}
                          data-current={h.isCurrent}
                          className={`flex flex-col items-center gap-0.5 px-2.5 py-0.5 rounded-xl transition-all duration-300 ${
                            h.isCurrent
                              ? 'bg-white/90 border border-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]'
                              : ''
                          }`}
                          style={{ minWidth: '48px' }}
                        >
                          <span className={`text-[11px] font-bold ${h.isCurrent ? 'text-slate-700 font-extrabold' : 'text-white'}`}>
                            {h.hour}시
                          </span>
                          <HourlyIcon size={18} strokeWidth={2} fill={getHourlyIconFill(HourlyIcon)} className={`my-0.5 ${h.isCurrent ? 'text-black' : 'text-white'} weather-rain-icon`} />
                          <span className={`text-[14px] font-black ${h.isCurrent ? 'text-slate-800' : 'text-white'}`}>{h.temp}°</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 미세먼지·자외선 수평 한 줄 정보바 */}
              <div className="flex justify-around items-center text-[11px] font-bold text-white/90 pt-3 border-t border-white/10 px-1">
                {airQuality.map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <item.Icon size={11} className="opacity-80 text-white flex-shrink-0" />
                    <span className="opacity-95 mr-0.5">{item.label}</span>
                    <span className="font-black" style={{ color: item.color }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-[-15px] top-[-15px] pointer-events-none transform rotate-12 weather-rain-icon" style={{
          color: weatherTheme.iconColor || '#ffffff',
          opacity: weatherTheme.iconColor ? 0.22 : 0.15
        }}>
          {weatherTheme.icon && React.createElement(weatherTheme.icon, { size: 160 })}
        </div>
      </div>
    </section>
  );
}
