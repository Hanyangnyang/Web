import React, { useMemo, useEffect, useRef } from 'react';
import { Sparkles, Wind, Sun, Bell } from 'lucide-react';
import type { Weather, HourlyForecastItem } from '../../../domain/entities/Weather.js';
import { TypewriterText } from './TypewriterText.js';
import { getHourlyIcon, getHourlyIconFill, getWeatherTheme } from './weatherTheme.js';

// 한파 판단 기준 기온(℃): 기상청 한파특보 절대기준(-12~-15도)보다 약간 낮춰
// 좀 더 자주 체감할 수 있도록 설정. 날씨 상태(맑음/흐림/비/눈)와 무관하게
// 기온만으로 판단해 기존 카드 위에 "한파" 뱃지만 얹는다.
const COLD_SNAP_TEMP = -10;

interface WeatherCardProps {
  weather: Weather | null;
  loading: boolean;
  isVisible?: boolean;
  onOpenAlarm?: () => void;
}

interface RenderedForecastItem extends HourlyForecastItem {
  isCurrent: boolean;
  isPast: boolean;
}

// 소식탭 날씨 박스: weather를 props로만 받는 순수 표시 컴포넌트 (Storybook 대응)
export function WeatherCard({ weather, loading, isVisible = true, onOpenAlarm }: WeatherCardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const showWeatherDetail = true;

  const { maxTemp, minTemp } = useMemo(() => {
    if (!weather?.hourlyForecast) return { maxTemp: null, minTemp: null };
    const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayTemps = weather.hourlyForecast
      .filter(item => {
        const itemDateStr = new Date(item.epoch + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
        return itemDateStr === todayStr;
      })
      .map(item => item.temp);

    if (todayTemps.length === 0) {
      const allTemps = weather.hourlyForecast.map(item => item.temp);
      return {
        maxTemp: Math.max(...allTemps),
        minTemp: Math.min(...allTemps)
      };
    }
    return {
      maxTemp: Math.max(...todayTemps),
      minTemp: Math.min(...todayTemps)
    };
  }, [weather]);

  // 클라이언트(브라우저)의 실제 현재 시각 기준으로 ±12시간 필터링
  // 핵심 원칙: 서버가 반환하는 hour값(UTC 기준 오염 가능)을 절대 신뢰하지 않고
  //           item.epoch + 브라우저 로컬 시각으로 모든 계산을 수행합니다.
  const renderedHourlyForecast = useMemo((): RenderedForecastItem[] => {
    if (!weather?.hourlyForecast) return [];

    const nowEpoch = Date.now();
    const twelveHoursAgo = nowEpoch - (12 * 60 * 60 * 1000);
    const twelveHoursLater = nowEpoch + (12 * 60 * 60 * 1000);

    // 현재 시각이 속한 정각 구간(정각 <= 현재 < 다음 정각)의 노드를 "지금"으로 판정
    const mapped = weather.hourlyForecast.map((item): RenderedForecastItem | null => {
      const epoch = item.epoch;
      if (!epoch) return null; // epoch 없는 구형 캐시 데이터 제거

      // 브라우저 로컬 시각(KST)으로 hour 직접 계산 (서버의 UTC hour 사용 안 함)
      const localHour = new Date(epoch).getHours();

      const isCurrent = epoch <= nowEpoch && epoch > nowEpoch - 60 * 60 * 1000;
      const isPast = epoch <= nowEpoch - 60 * 60 * 1000;

      return {
        ...item,
        hour: localHour, // 브라우저 KST 기준 시각으로 덮어쓰기
        temp: isCurrent ? weather.temp : item.temp, // 실시간 메인 카드 온도와 싱크 맞춤
        isCurrent,
        isPast
      };
    }).filter((item): item is RenderedForecastItem => item !== null);

    const filtered = mapped.filter(item => {
      return item.epoch >= twelveHoursAgo && item.epoch <= twelveHoursLater;
    });

    // Fallback: ±30분 내 exact match가 없을 경우 epoch 기준 가장 가까운 노드를 "지금"으로 보정
    const hasCurrent = filtered.some(item => item.isCurrent);
    if (!hasCurrent && filtered.length > 0) {
      let closestIdx = 0;
      let minDiff = Infinity;
      filtered.forEach((item, idx) => {
        const diff = Math.abs(item.epoch - nowEpoch);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      filtered[closestIdx] = { ...filtered[closestIdx], temp: weather.temp, isCurrent: true, isPast: false };
      for (let i = 0; i < closestIdx; i++) {
        filtered[i] = { ...filtered[i], isPast: true };
      }
    }

    return filtered;
  }, [weather]);

  // 더보기로 예보 스트립이 펼쳐졌을 때, 현재 시간('지금') 위치로 가로 스크롤바를 자동 정렬
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (showWeatherDetail && container && renderedHourlyForecast.length > 0) {
      const timer = setTimeout(() => {
        const activeEl = container.querySelector<HTMLElement>('[data-current="true"]');
        if (activeEl) {
          container.scrollTo({
            left: activeEl.offsetLeft - 16,
            behavior: 'smooth'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [renderedHourlyForecast, showWeatherDetail]);

  const weatherTheme = useMemo(() => getWeatherTheme(weather), [weather]);

  if (!loading && !weather) return null;

  return (
    <section className="-mt-3 mb-3">
      {loading ? (
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
      ) : weather ? (
        <div className="rounded-card p-4 text-white relative overflow-hidden min-h-[180px] flex flex-col justify-start shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300" style={{
          background: weatherTheme.bg
        }}>
          <div className="relative z-10 w-full">
            <div className="flex flex-col w-full">
              {/* 카드의 좌측 정보(위치, 기온) 및 우측 상단 알림 버튼 배치 */}
              <div className="flex items-start justify-between w-full pl-2">
                <div className="[text-shadow:0_1px_1px_rgba(0,0,0,0.3)]">
                  <p className="text-xs font-semibold opacity-85 leading-tight">
                    안산시 상록구 사동
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-black tracking-tight leading-none">{weather.temp}°</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="text-lg font-bold opacity-90 leading-tight">{weather.description}</span>
                      {weather.temp <= COLD_SNAP_TEMP && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-white/80 text-[10px] font-bold tracking-tight">
                          한파
                        </span>
                      )}
                    </span>
                  </div>
                  {maxTemp !== null && minTemp !== null && (
                    <p className="text-xs font-bold opacity-85 leading-tight mt-0.5 flex items-center gap-1">
                      <span>최고 {maxTemp}°</span>
                      <span>최저 {minTemp}°</span>
                    </p>
                  )}
                </div>

                {/* 카드 우측 상단 날씨 알림 받기 버튼 */}
                {onOpenAlarm && (
                  <button
                    type="button"
                    onClick={onOpenAlarm}
                    className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs [text-shadow:none] flex-shrink-0"
                  >
                    <Bell size={12} className="text-white" />
                    <span>알림 받기</span>
                  </button>
                )}
              </div>

              {/* 날씨 변화 박스 (AI 요약 + 시간별 예보 통합 카드): 배경 그라데이션 밝기와 무관하게
                  흰 텍스트 대비를 확보하기 위해 반투명 검정 오버레이 사용 (기존 bg-white/10은
                  밝은 배경일수록 대비가 무너졌음). 자세히 들여다보지 않는 보조 정보라 /28 정도로만 살짝. */}
              <div className="mt-2 bg-slate-900/28 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                {weather.message && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start text-xs font-bold leading-normal w-full opacity-90 px-0.5">
                      <Sparkles size={14} className="mr-1.5 mt-[2px] flex-shrink-0 text-white/80" />
                      <span className="break-all flex-1">
                        <TypewriterText text={weather.message} isVisible={isVisible} />
                      </span>
                    </div>
                    <div className="border-t border-white/10 w-full" />
                  </div>
                )}

                {/* 시간별 예보 스트립 (이전 12시간 ~ 이후 12시간 실시간 가로 윈도우 스크롤) */}
                {renderedHourlyForecast.length > 0 && (
                  <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto no-scrollbar"
                  >
                    <div className="flex w-full" style={{ minWidth: 'max-content', padding: '1px 0' }}>
                      {renderedHourlyForecast.map((h, idx) => {
                        const isCurrent = h.isCurrent;
                        const isPast = h.isPast;
                        const HourlyIcon = getHourlyIcon(h.weatherCode, h.hour);
                        return (
                          <div
                            key={idx}
                            data-current={isCurrent}
                            className={`flex flex-col items-center gap-0.5 px-2.5 py-0.5 rounded-xl transition-all duration-300 ${
                              isCurrent
                                ? 'bg-white/90 border border-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]'
                                : ''
                            } ${isPast ? 'opacity-55' : 'opacity-100'}`}
                            style={{ minWidth: '48px' }}
                          >
                            <span className={`text-[11px] font-bold ${isCurrent ? 'text-slate-700 font-extrabold' : 'text-white'}`}>
                              {h.hour}시
                            </span>
                            <HourlyIcon size={18} strokeWidth={2} fill={getHourlyIconFill(HourlyIcon)} className={`my-0.5 ${isCurrent ? 'text-black' : 'text-white'} weather-rain-icon`} />
                            <span className={`text-[14px] font-black ${isCurrent ? 'text-slate-800' : 'text-white'}`}>{h.temp}°</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 미세먼지 수평 한 줄 정보바 추가 */}
                {weather.airQuality && (
                  <div className="flex justify-around items-center text-[11px] font-bold text-white/90 pt-3 border-t border-white/10 px-1">
                    {[
                      { label: '미세', data: weather.airQuality.pm10, icon: Wind },
                      { label: '초미세', data: weather.airQuality.pm25, icon: Wind },
                      { label: '자외선', data: weather.airQuality.uv, icon: Sun }
                    ].map((item, idx) => {
                      const dotColor = item.data.color === '#2563eb' ? '#38bdf8' : item.data.color;
                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <item.icon size={11} className="opacity-80 text-white flex-shrink-0" />
                          <span className="opacity-95 mr-0.5">{item.label}</span>
                          <span className="font-black" style={{ color: dotColor }}>{item.data.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
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
      ) : null}
    </section>
  );
}
