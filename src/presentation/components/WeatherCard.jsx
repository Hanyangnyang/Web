import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Sparkles, CloudRain, Snowflake, Wind, Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudLightning } from 'lucide-react';

// 모듈 레벨 메모리 변수: 앱이 켜진 세션 동안 한 번 완벽히 타이핑이 끝나면 이를 기억하여 내부 탭 전환 시 생략
let hasAnimatedThisSession = false;

function TypewriterText({ text, speed = 55, delay = 2000, isVisible = true }) {
  const [displayed, setDisplayed] = useState(() => {
    return hasAnimatedThisSession ? text : '';
  });
  const [waiting, setWaiting] = useState(false); // delay 구간 (커서 깜빡임)

  useEffect(() => {
    // 1. 이미 이번 세션에 애니메이션이 완료되었다면 즉시 전문 노출 및 생략
    if (hasAnimatedThisSession) {
      setDisplayed(text);
      setWaiting(false);
      return;
    }

    // 2. 탭이 숨겨지거나 텍스트가 아직 없는 경우 플래그 리셋 및 대기
    if (!isVisible || !text) {
      setWaiting(false);
      return;
    }

    // 3. 타이핑 진행 시작
    setDisplayed('');
    setWaiting(true); // 커서 깜빡임 시작

    let i = 0;
    let typingTimer = null;

    const startTyping = () => {
      setWaiting(false); // 커서 제거 후 타이핑 시작
      typingTimer = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(typingTimer);
          hasAnimatedThisSession = true; // 타이핑이 완벽히 한 번 끝나면 세션 플래그 true 설정
        }
      }, speed);
    };

    const delayTimer = setTimeout(startTyping, delay);
    return () => {
      clearTimeout(delayTimer);
      if (typingTimer) clearInterval(typingTimer);
    };
  }, [text, isVisible]);

  return (
    <span>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typewriterBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
      {displayed || '​'}
      {waiting && (
        <span
          className="inline-block w-[2px] h-[1.1em] bg-white ml-0.5 align-middle rounded-sm"
          style={{ animation: 'typewriterBlink 1.2s steps(2, start) infinite' }}
        />
      )}
    </span>
  );
}

// 시간별 예보 2D 아이콘 매핑
function getHourlyIcon(code, hour) {
  const isNight = hour >= 20 || hour < 6;
  if (code <= 0) return isNight ? Moon : Sun;
  if (code <= 1) return isNight ? CloudMoon : CloudSun;
  if (code <= 2) return CloudSun;
  if (code <= 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 67) return CloudRain;
  if (code <= 77) return Snowflake; // 비 아이콘(CloudRain)과 구분되도록 구름 없는 눈송이 아이콘 사용
  if (code <= 82) return CloudDrizzle;
  return CloudLightning;
}

// 구름은 흰색으로 아이콘 내부를 채우고, 해·달·눈송이는 테두리만(무채움) 표시
function getHourlyIconFill(Icon) {
  if (
    Icon === Cloud ||
    Icon === CloudSun ||
    Icon === CloudMoon ||
    Icon === CloudFog ||
    Icon === CloudRain ||
    Icon === CloudDrizzle ||
    Icon === CloudLightning
  ) {
    return '#ffffff';
  }
  return 'none';
}

// 소식탭 날씨 박스: weather를 props로만 받는 순수 표시 컴포넌트 (Storybook 대응)
export function WeatherCard({ weather, loading, isVisible = true }) {
  const scrollContainerRef = useRef(null);
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
  const renderedHourlyForecast = useMemo(() => {
    if (!weather?.hourlyForecast) return [];

    const nowEpoch = Date.now();
    const twelveHoursAgo = nowEpoch - (12 * 60 * 60 * 1000);
    const twelveHoursLater = nowEpoch + (12 * 60 * 60 * 1000);

    // 현재 시각이 속한 정각 구간(정각 <= 현재 < 다음 정각)의 노드를 "지금"으로 판정
    const mapped = weather.hourlyForecast.map(item => {
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
    }).filter(Boolean);

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
    if (showWeatherDetail && scrollContainerRef.current && renderedHourlyForecast.length > 0) {
      const timer = setTimeout(() => {
        const activeEl = scrollContainerRef.current.querySelector('[data-current="true"]');
        if (activeEl) {
          scrollContainerRef.current.scrollTo({
            left: activeEl.offsetLeft - 16,
            behavior: 'smooth'
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [renderedHourlyForecast, showWeatherDetail]);

  // 날씨 상태에 따른 프리미엄 동적 테마 정의 (배경 그라데이션 및 매칭 아이콘)
  const weatherTheme = useMemo(() => {
    if (!weather) return { icon: null, bg: 'transparent' };
    const code = weather.weatherCode;

    // 1. 맑음 / 대체로 맑음 (0, 1)
    if (code <= 1) {
      const isHot = weather.temp >= 28;
      return {
        icon: Sun,
        bg: isHot
          ? 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)' // 28도 이상: 찬란하고 강렬한 골드&오렌지 햇살 (빛이 들어오는 느낌)
          : 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)'  // 28도 미만: 청량하고 깨끗한 시원한 스카이 블루
      };
    }
    // 2. 구름 조금 (2) -> 화사하고 밝은 파스텔톤의 소프트 블루스카이
    if (code === 2) {
      return {
        icon: Cloud,
        bg: 'linear-gradient(135deg, #4a779d 0%, #7db9e8 100%)'
      };
    }
    // 3. 흐림 / 안개 (3, 45, 48) -> 밝고 화사한 프리미엄 클라우드 그레이
    if (code === 3 || code <= 48) {
      return {
        icon: code <= 3 ? Cloud : Wind,
        bg: 'linear-gradient(135deg, #a1b0be 0%, #66788a 100%)'
      };
    }
    // 4. 눈 (71 ~ 77) -> 눈 결정 아이콘 + 눈부시게 밝은 설원과 순백의 화이트 스카이
    if (code >= 71 && code <= 77) {
      return {
        icon: Snowflake,
        bg: 'linear-gradient(135deg, #8ca0ba 0%, #ffffff 100%)',
        iconColor: '#4A607A'
      };
    }
    // 5. 비 / 소나기 / 뇌우 -> 깊고 차분한 딥스톰 퍼플그레이
    return {
      icon: CloudRain,
      bg: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)'
    };
  }, [weather]);

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
                <div key={i} className="flex flex-col items-center gap-0.5 py-0.5 flex-shrink-0" style={{ minWidth: '46px' }}>
                  <div className="h-[11px] w-5 bg-slate-200 rounded-full" />
                  <div className="h-4 w-4 bg-slate-200 rounded-full my-0.5" />
                  <div className="h-[13px] w-5 bg-slate-200 rounded-full" />
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
              <div className="pl-2">
                <p className="text-xs font-semibold opacity-75">
                  안산시 상록구 사동
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-5xl font-black tracking-tight leading-none">{weather.temp}°</span>
                  <span className="text-xl font-bold opacity-90 leading-tight">{weather.description}</span>
                </div>
                {maxTemp !== null && minTemp !== null && (
                  <p className="text-xs font-bold opacity-75 mt-1 flex items-center gap-1">
                    <span>최고 {maxTemp}°</span>
                    <span>최저 {minTemp}°</span>
                  </p>
                )}
              </div>

              {/* 날씨 변화 박스 (AI 요약 + 시간별 예보 통합 카드) */}
              <div className="mt-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2">
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
                            style={{ minWidth: '46px' }}
                          >
                            <span className={`text-[11px] font-bold ${isCurrent ? 'text-slate-700 font-extrabold' : 'text-white'}`}>
                              {h.hour}시
                            </span>
                            <HourlyIcon size={16} strokeWidth={2} fill={getHourlyIconFill(HourlyIcon)} className={`my-0.5 ${isCurrent ? 'text-black' : 'text-white'} weather-rain-icon`} />
                            <span className={`text-[13px] font-black ${isCurrent ? 'text-slate-800' : 'text-white'}`}>{h.temp}°</span>
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
