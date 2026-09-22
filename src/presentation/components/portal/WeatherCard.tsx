import { useMemo } from 'react';
import type { Weather, WeatherCondition } from '../../../domain/entities/Weather.js';
import { CardFallback } from '../common/CardFallback.js';
import { getHourlyIcon, getHourlyIconFill, getWeatherTheme, CONDITION_LABEL, UNKNOWN_CONDITION_LABEL } from './weatherTheme.js';
import { useNow } from '../../hooks/useNow.js';

const COLD_SNAP_TEMP = -10;     // 한파 판단 기준 기온(℃)
const HOUR = 60 * 60 * 1000;
const FORECAST_HOURS = 24;      // 지금 시각이 속한 칸부터 앞으로 몇 시간을 보여줄지 (백엔드가 그만큼 안 주면 필터에서 자연히 있는 만큼만 남음)

interface WeatherCardProps {
  weather: Weather | null;
  loading: boolean;
  isVisible?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

interface RenderedForecastItem {
  epoch: number;
  hour: number;
  temp: number;
  condition: WeatherCondition | null;
  isCurrent: boolean;
}

function WeatherSkeleton() {
  return (
    <div className="rounded-card p-4 bg-slate-100 animate-pulse flex items-stretch gap-3">
      <div className="pl-2">
        <div className="h-3 w-20 bg-slate-200 rounded-full" />
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <div className="h-12 w-24 bg-slate-200 rounded-xl" />
          <div className="h-5 w-14 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-3 w-24 bg-slate-200 rounded-full mt-2" />
      </div>
      <div className="flex-1 min-w-0 bg-slate-200/60 rounded-xl p-1 flex items-center gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 py-1.5 flex-shrink-0" style={{ minWidth: '40px' }}>
            <div className="h-[11px] w-5 bg-slate-200 rounded-full" />
            <div className="h-[18px] w-[18px] bg-slate-200 rounded-full my-0.5" />
            <div className="h-[14px] w-5 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 소식탭 날씨 박스: weather를 props로만 받는 순수 표시 컴포넌트 (Storybook 대응)
export function WeatherCard({ weather, loading, isVisible = true, error = null, onRetry }: WeatherCardProps) {
  const nowEpoch = useNow(isVisible);
  const current = weather?.current ?? null;
  const hourly = weather?.hourly;
  const currentTemp = current?.temp;

  const renderedHourlyForecast = useMemo((): RenderedForecastItem[] => {
    if (!hourly || currentTemp === undefined) return [];

    // 지금이 속한 정각 칸(=최근 1시간 안)부터 앞으로 24시간(백엔드 제공 범위 안에서).
    // 시각 계산은 서버가 준 시(hour)가 아니라 epoch으로만 한다 — 예전에 서버 hour가 UTC로
    // 오염돼 시간대가 밀린 적이 있어서, 절대시각에서 매번 다시 뽑는다.
    const from = nowEpoch - HOUR;
    const to = nowEpoch + FORECAST_HOURS * HOUR;

    return hourly
      .filter(item => item.epoch > from && item.epoch <= to)
      .map(item => {
        const isCurrent = item.epoch <= nowEpoch;
        return {
          epoch: item.epoch,
          hour: new Date(item.epoch).getHours(),
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
    return <section className="-mt-3"><CardFallback message="날씨 정보를 불러오지 못했습니다" onRetry={onRetry} className="min-h-[130px]" /></section>;
  }

  // 3. 아직 아무것도 못 받음 — 실패도 아니므로 자리를 비워둔다
  if (!current) return null;

  // 4. 정상
  return (
    <section className="-mt-3">
      <div className="rounded-card p-4 text-white relative overflow-hidden flex flex-col justify-start shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300" style={{
        background: weatherTheme.bg
      }}>
        <div className="relative z-10 w-full">
          <div className="flex items-stretch gap-3 w-full">
            <div className="pl-2 [text-shadow:0_1px_1px_rgba(0,0,0,0.15)]">
              <p className="text-xs font-semibold opacity-85 leading-tight">
                안산시 상록구 사동
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-tight leading-none">{current.temp}°</span>
                {/* 날씨 상태(맑음·비 등)는 화면에 안 보여주고 스크린리더용으로만 남긴다 */}
                <span className="sr-only">{current.condition ? CONDITION_LABEL[current.condition] : UNKNOWN_CONDITION_LABEL}</span>
                {current.temp <= COLD_SNAP_TEMP && (
                  <span className="px-1 py-0.5 rounded-full bg-white/25 text-white/80 text-[10px] font-bold tracking-tight">
                    한파
                  </span>
                )}
              </div>
              {current.maxTemp !== null && current.minTemp !== null && (
                <p className="text-xs font-bold opacity-85 leading-tight mt-0.5 flex items-center gap-1">
                  <span>최고 {current.maxTemp}°</span>
                  <span>최저 {current.minTemp}°</span>
                </p>
              )}
            </div>
            {/* 시간별 기온 스트립 (기온 블록 오른쪽, 지금부터 앞으로 24시간, 백엔드 제공 범위 안에서). 옆으로 스크롤된다. */}
            {renderedHourlyForecast.length > 0 && (
              <div className="flex-1 min-w-0 flex items-center bg-slate-900/28 backdrop-blur-md border border-white/10 rounded-xl p-1">
                <div className="w-full overflow-x-auto no-scrollbar">
                  <div className="flex w-full" style={{ minWidth: 'max-content', padding: '1px 0' }}>
                    {renderedHourlyForecast.map((h) => {
                      const HourlyIcon = getHourlyIcon(h.condition, h.hour);
                      return (
                        <div
                          key={h.epoch}
                          data-current={h.isCurrent}
                          className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl border transition-all duration-300 ${
                            h.isCurrent ? 'border-white' : 'border-transparent'
                          }`}
                          style={{ minWidth: '40px' }}
                        >
                          <span className={`text-[11px] leading-none text-white ${h.isCurrent ? 'font-extrabold' : 'font-bold'}`}>
                            {h.hour}시
                          </span>
                          <HourlyIcon size={18} strokeWidth={2} fill={getHourlyIconFill(HourlyIcon)} className="my-0.5 text-white weather-rain-icon" />
                          <span className="text-[14px] leading-none font-black text-white">{h.temp}°</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
