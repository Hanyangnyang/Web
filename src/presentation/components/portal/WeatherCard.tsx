import React, { useMemo } from 'react';
import type { Weather } from '../../../domain/entities/Weather.js';
import { CardFallback } from '../common/CardFallback.js';
import { getWeatherTheme, CONDITION_LABEL, UNKNOWN_CONDITION_LABEL } from './weatherTheme.js';

const COLD_SNAP_TEMP = -10;     // 한파 판단 기준 기온(℃)

interface WeatherCardProps {
  weather: Weather | null;
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function WeatherSkeleton() {
  return (
    // 실제 카드와 같은 한 줄 구성: [기온 + 상태] [위치 / 최고·최저 2줄], 오른쪽에 흐린 날씨 아이콘 자리
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl rounded-t-none px-4 py-3 animate-pulse relative overflow-hidden flex flex-col justify-start">
      <div className="pl-1 flex items-center gap-3">
        <div className="flex items-baseline gap-1.5">
          <div className="h-9 w-16 bg-slate-200 rounded-xl" />
          <div className="h-4 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-24 bg-slate-200 rounded-full" />
          <div className="h-3 w-28 bg-slate-200 rounded-full" />
        </div>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 h-[60px] w-[60px] rounded-full bg-slate-200/60" />
    </div>
  );
}

// 소식탭 날씨 카드: weather를 props로만 받는 순수 표시 컴포넌트 (Storybook 대응)
export function WeatherCard({ weather, loading, error = null, onRetry }: WeatherCardProps) {
  const current = weather?.current ?? null;

  const weatherTheme = useMemo(() => getWeatherTheme(weather), [weather]);

  // 1. 첫 로딩 — 스켈레톤
  if (loading) {
    return <section><WeatherSkeleton /></section>;
  }

  // 2. 조회 실패 — 캐시된 이전 데이터도 없을 때만. 있으면 그걸 계속 보여준다(아래 4번).
  if (error && !current) {
    return <section><CardFallback message="날씨 정보를 불러오지 못했습니다" onRetry={onRetry} className="min-h-[180px]" /></section>;
  }

  // 3. 아직 아무것도 못 받음 — 실패도 아니므로 자리를 비워둔다
  if (!current) return null;

  // 4. 정상
  return (
    <section>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl rounded-t-none px-4 py-3 text-slate-800 relative overflow-hidden flex flex-col justify-start select-none">
        <div className="relative z-10 w-full">
          <div className="flex flex-col w-full">
            <div className="pl-1 flex items-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black tracking-tight leading-none">{current.temp}°</span>
                {/* 설명 텍스트와 한파 뱃지는 기준선이 아닌 수평 중앙선을 기준으로 나란히 정렬 */}
                <span className="inline-flex items-center gap-1">
                  <span className="text-base font-bold text-slate-600 leading-tight">
                    {current.condition ? CONDITION_LABEL[current.condition] : UNKNOWN_CONDITION_LABEL}
                  </span>
                  {current.temp <= COLD_SNAP_TEMP && (
                    <span className="px-1 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-tight">
                      한파
                    </span>
                  )}
                </span>
              </div>
              {/* 현재 기온·상태 오른쪽: 위치 + 최고/최저 */}
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-semibold text-slate-400 leading-tight">
                  안산시 상록구 사동
                </p>
                {current.maxTemp !== null && current.minTemp !== null && (
                  <p className="text-xs font-bold text-slate-500 leading-tight flex items-center gap-1">
                    <span>최고 {current.maxTemp}°</span>
                    <span>최저 {current.minTemp}°</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-12 weather-rain-icon" style={{
          color: weatherTheme.color,
          opacity: 0.18
        }}>
          {weatherTheme.icon && React.createElement(weatherTheme.icon, { size: 60 })}
        </div>
      </div>
    </section>
  );
}
