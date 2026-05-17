import React, { useMemo, useState, useEffect, useRef } from 'react';

import { Sparkles, CloudRain, Snowflake, Wind, Sun, Cloud, Loader2, Info, Users, Heart, Bell } from 'lucide-react';
import { usePortalData } from '../hooks/usePortalData.js';
import { WeatherAlarmSettings } from './WeatherAlarmSettings.jsx';


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
      {displayed || '\u200B'}
      {waiting && (
        <span 
          className="inline-block w-[2px] h-[1.1em] bg-white ml-0.5 align-middle rounded-sm"
          style={{ animation: 'typewriterBlink 1.2s steps(2, start) infinite' }}
        />
      )}
    </span>
  );
}

export function PortalView({ isVisible = true }) {
  const { weather, library, loading } = usePortalData();
  const [showWeatherAlarm, setShowWeatherAlarm] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');
  const scrollContainerRef = useRef(null);
  
  // 클라이언트(브라우저)의 실제 현재 시각 기준으로 ±12시간 필터링
  // 핵심 원칙: 서버가 반환하는 hour값(UTC 기준 오염 가능)을 절대 신뢰하지 않고
  //           item.epoch + 브라우저 로컬 시각으로 모든 계산을 수행합니다.
  const renderedHourlyForecast = useMemo(() => {
    if (!weather?.hourlyForecast) return [];

    const nowEpoch = Date.now();
    const twelveHoursAgo = nowEpoch - (12 * 60 * 60 * 1000);
    const twelveHoursLater = nowEpoch + (12 * 60 * 60 * 1000);

    // epoch 기준 ±30분 이내이면 "지금" 노드로 판정 (문자열 비교 없음)
    const mapped = weather.hourlyForecast.map(item => {
      const epoch = item.epoch;
      if (!epoch) return null; // epoch 없는 구형 캐시 데이터 제거

      // 브라우저 로컬 시각(KST)으로 hour 직접 계산 (서버의 UTC hour 사용 안 함)
      const localHour = new Date(epoch).getHours();

      const isCurrent = Math.abs(epoch - nowEpoch) < 30 * 60 * 1000;
      const isPast = epoch < nowEpoch - (30 * 60 * 1000);

      return {
        ...item,
        hour: localHour, // 브라우저 KST 기준 시각으로 덮어쓰기
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
      filtered[closestIdx] = { ...filtered[closestIdx], isCurrent: true, isPast: false };
      for (let i = 0; i < closestIdx; i++) {
        filtered[i] = { ...filtered[i], isPast: true };
      }
    }

    return filtered;
  }, [weather]);

  // 날씨 탭에 진입하거나 날씨 데이터가 로드될 때, 현재 시간('지금') 위치로 가로 스크롤바를 자동 정렬
  useEffect(() => {
    if (isVisible && scrollContainerRef.current && renderedHourlyForecast.length > 0) {
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
  }, [renderedHourlyForecast, isVisible]);

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

  // 시간별 예보 이모지 매핑
  function getHourlyEmoji(code, hour) {
    const isNight = hour >= 20 || hour < 6;
    if (code <= 0) return isNight ? '🌙' : '☀️';
    if (code <= 1) return isNight ? '🌙' : '🌤️';
    if (code <= 2) return '⛅';
    if (code <= 3) return '☁️';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌦️';
    return '⛈️';
  }

  return (
    <>
      <button
        className="fixed bottom-[calc(20px+64px+12px)] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
        onClick={() => setShowWeatherAlarm(true)}
      >
        <Bell size={18} />
        날씨 알림 받기
      </button>
      {showWeatherAlarm && (
        <WeatherAlarmSettings onClose={(msg) => {
          setShowWeatherAlarm(false);
          if (msg) {
            setAlarmPopup(msg);
            setTimeout(() => setAlarmPopup(''), 1500);
          }
        }} />
      )}
      {alarmPopup && (
        <div className="fixed bottom-[calc(20px+64px+60px)] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[1000] whitespace-pre-line text-center copy-toast">
          {alarmPopup}
        </div>
      )}

      <div className="pb-24 relative [animation:slideUp_0.4s_ease-out]">
        {/* 1. 오늘의 날씨 & 소식 섹션 */}
        {(loading || weather) && (
          <section className="mb-10">
            <h3 className="text-xl font-bold text-text-main mb-4">오늘의 날씨</h3>
            {loading ? (
              <div className="rounded-card min-h-[180px] bg-slate-100 animate-pulse flex flex-col justify-between p-6">
                <div className="flex flex-col gap-3">
                  <div className="h-12 w-36 bg-slate-200 rounded-xl" />
                  <div className="h-4 w-28 bg-slate-200 rounded-full" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl mt-6" />
              </div>
            ) : weather ? (
              <div className="rounded-card p-6 text-white relative overflow-hidden min-h-[180px] flex flex-col justify-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300" style={{ 
                background: weatherTheme.bg
              }}>
                <div className="relative z-10 w-full">
                  <div className="flex flex-col w-full">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-black tracking-tight leading-none">{weather.temp}°</span>
                      <span className="text-xl font-bold opacity-90">{weather.description}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold opacity-70 flex items-center gap-1">
                      안산시 상록구 사동
                    </p>
                    
                    <div className="mt-5 bg-white/20 backdrop-blur-lg py-2.5 px-4 rounded-xl flex items-start text-sm font-bold leading-relaxed w-full border border-white/10">
                      <Sparkles size={15} className="mr-2 mt-[6px] flex-shrink-0 text-white/70" />
                      <span className="break-all flex-1">
                        <TypewriterText text={weather.message} isVisible={isVisible} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute right-[-15px] top-[-15px] pointer-events-none transform rotate-12" style={{
                  color: weatherTheme.iconColor || '#ffffff',
                  opacity: weatherTheme.iconColor ? 0.22 : 0.15
                }}>
                  {weatherTheme.icon && React.createElement(weatherTheme.icon, { size: 160 })}
                </div>

                {weather.airQuality && (
                  <div className="grid grid-cols-3 gap-3 mt-8 relative z-10">
                    {[
                      { label: '미세먼지', data: weather.airQuality.pm10, icon: Wind },
                      { label: '초미세', data: weather.airQuality.pm25, icon: Wind },
                      { label: '자외선', data: weather.airQuality.uv, icon: Sun }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white/95 backdrop-blur-sm rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 shadow-md">
                        <span className="text-[10px] text-text-sub font-black uppercase tracking-widest opacity-80">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <item.icon size={14} color={item.data.color} strokeWidth={3} />
                          <span className="text-[14px] font-black" style={{ color: item.data.color }}>{item.data.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* 시간별 예보 스트립 (이전 12시간 ~ 이후 12시간 실시간 가로 윈도우 스크롤) */}
            {renderedHourlyForecast.length > 0 && (
              <div 
                ref={scrollContainerRef}
                className="mt-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-x-auto no-scrollbar"
              >
                <div className="flex" style={{ minWidth: 'max-content', padding: '12px 8px' }}>
                  {renderedHourlyForecast.map((h, idx) => {
                    const isCurrent = h.isCurrent;
                    const isPast = h.isPast;
                    return (
                      <div
                        key={idx}
                        data-current={isCurrent}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                          isCurrent 
                            ? 'bg-blue-50/80 border border-blue-100/60 shadow-[0_1px_3px_rgba(37,99,235,0.06)]' 
                            : 'border border-transparent'
                        } ${isPast ? 'opacity-55' : 'opacity-100'}`}
                        style={{ minWidth: '54px' }}
                      >
                        <span className={`text-[11px] font-bold ${isCurrent ? 'text-blue-600 font-extrabold' : 'text-text-sub'}`}>
                          {isCurrent ? '지금' : `${h.hour}시`}
                        </span>
                        <span className="text-[22px] leading-none my-0.5">{getHourlyEmoji(h.weatherCode, h.hour)}</span>
                        <span className={`text-[13px] font-black ${isCurrent ? 'text-blue-700' : 'text-text-main'}`}>{h.temp}°</span>
                        {h.precipProb > 20 && (
                          <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-600' : 'text-blue-400'}`}>{h.precipProb}%</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

      {/* 2. 열람실 혼잡도 섹션 */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-text-main mb-4">열람실 혼잡도</h3>
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-card border border-[#e2e8f0] p-5 h-[140px] animate-pulse flex flex-col justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                  <div className="h-6 w-1/2 bg-slate-100 rounded-lg" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full" />
              </div>
            ))
          ) : library?.list ? (
            library.list.map((room) => {
              const emptySeats = Math.max(0, room.total - room.occupied);
              return (
                <div key={room.id} className="bg-white rounded-card border border-[#e2e8f0] p-5 flex flex-col gap-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-[0.95rem] text-text-main truncate leading-tight min-w-0 flex-1">
                      {room.name.replace(' (2F)', '').replace(' (4F)', '')}
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black flex-shrink-0 shadow-sm" style={{ 
                      backgroundColor: `${room.color}15`,
                      color: room.color,
                      border: `1px solid ${room.color}20`
                    }}>
                      {room.emoji} {room.status}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)" style={{ 
                        width: `${room.ratio * 100}%`, 
                        backgroundColor: room.color
                      }} />
                    </div>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-[11px] text-text-sub font-bold">
                        {room.occupied} / {room.total}
                      </span>
                      <span className="text-[12px] text-text-main font-black">
                        {emptySeats}석 남음
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 bg-white rounded-card border border-[#e2e8f0] py-8 flex flex-col items-center gap-2 shadow-sm opacity-80">
              <Info size={20} className="text-text-hint" />
              <p className="text-center text-text-sub text-sm font-semibold">혼잡도 정보를 불러올 수 없습니다</p>
            </div>
          )}
        </div>
      </section>
      </div>
    </>
  );
}
