import React, { useMemo, useState, useEffect, useRef } from 'react';

import { Sparkles, CloudRain, Snowflake, Wind, Sun, Moon, Cloud, CloudSun, CloudMoon, CloudFog, CloudDrizzle, CloudSnow, CloudLightning, Loader2, Info, Users, Heart, Bell, ExternalLink, ChevronDown } from 'lucide-react';
import { usePortalData } from '../hooks/usePortalData.js';
import { WeatherAlarmSettings } from './WeatherAlarmSettings.jsx';
import { supabase } from '../../lib/supabase.js';
import ericaNewsData from '../../data/ericaNews.json';

const ERICA_NEWS_CATEGORY_EMOJI = {
  academic: '🎓',
  scholarship: '💰',
  culture: '🎉',
  welfare: '🍀',
};

// start_at/end_at과 현재 시각을 비교해 D-day 배지 텍스트와 강조 여부(tone)를 계산
function getEricaNewsDday(item, now) {
  const start = new Date(item.start_at).getTime();
  const end = new Date(item.end_at).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (now < start) {
    const daysToStart = Math.ceil((start - now) / dayMs);
    return { label: `D-${daysToStart}`, tone: daysToStart <= 3 ? 'urgent' : 'default' };
  }
  const daysToEnd = Math.ceil((end - now) / dayMs);
  if (daysToEnd <= 0) return { label: 'D-0', tone: 'urgent' };
  if (daysToEnd <= 3) return { label: `D-${daysToEnd}`, tone: 'urgent' };
  return { label: '진행중', tone: 'active' };
}

// "6/20~6/22" 형태의 명시적 기간 텍스트
function formatEricaNewsPeriod(item) {
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  const start = new Date(item.start_at);
  const end = new Date(item.end_at);
  const startStr = fmt(start);
  const endStr = fmt(end);
  return startStr === endStr ? startStr : `${startStr}~${endStr}`;
}

// 모의수강신청/수강신청처럼 시간 단위 구분이 중요한 항목을 위한 "월/일 시:분~시:분" 포맷
const ERICA_NEWS_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatEricaNewsPeriodWithTime(item) {
  const dateFmt = (d) => `${d.getMonth() + 1}/${d.getDate()} (${ERICA_NEWS_DAY_NAMES[d.getDay()]})`;
  const timeFmt = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const start = new Date(item.start_at);
  const end = new Date(item.end_at);
  const startDateStr = dateFmt(start);
  const endDateStr = dateFmt(end);

  // 종료 시각이 다음날 00:00이면 "24:00"으로 표기 (예: 15:00~24:00)
  const oneDayMs = 24 * 60 * 60 * 1000;
  const isNextDayMidnight = end.getHours() === 0 && end.getMinutes() === 0 &&
    (end.getTime() - start.getTime()) <= oneDayMs && endDateStr !== startDateStr;

  if (startDateStr === endDateStr) {
    return `${startDateStr} ${timeFmt(start)}~${timeFmt(end)}`;
  }
  if (isNextDayMidnight) {
    return `${startDateStr} ${timeFmt(start)}~24:00`;
  }
  return `${startDateStr} ${timeFmt(start)}~${endDateStr} ${timeFmt(end)}`;
}


// 모듈 레벨 메모리 변수: 앱이 켜진 세션 동안 한 번 완벽히 타이핑이 끝나면 이를 기억하여 내부 탭 전환 시 생략
let hasAnimatedThisSession = false;

function BannerCarousel({ banners }) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const axisLockedRef = useRef(null); // 'h' | 'v' | null
  const isSwiping = useRef(false);
  const mouseStartXRef = useRef(null);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      axisLockedRef.current = null;
      isSwiping.current = false;
    };

    const onTouchMove = (e) => {
      if (touchStartXRef.current === null) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartXRef.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartYRef.current);
      if (!axisLockedRef.current) {
        axisLockedRef.current = dx > dy ? 'h' : 'v';
      }
      if (axisLockedRef.current === 'h') {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e) => {
      if (touchStartXRef.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartXRef.current;
      if (axisLockedRef.current === 'h' && Math.abs(delta) > 40) {
        isSwiping.current = true;
        setCurrent((prev) => (delta < 0 ? (prev + 1) % banners.length : (prev - 1 + banners.length) % banners.length));
        resetTimer();
        setTimeout(() => { isSwiping.current = false; }, 0);
      }
      touchStartXRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [banners.length]);



  const handleMouseDown = (e) => { mouseStartXRef.current = e.clientX; };
  const handleMouseUp = (e) => {
    if (mouseStartXRef.current === null) return;
    const delta = e.clientX - mouseStartXRef.current;
    if (Math.abs(delta) > 40) {
      isSwiping.current = true;
      setCurrent((prev) => (delta < 0 ? (prev + 1) % banners.length : (prev - 1 + banners.length) % banners.length));
      resetTimer();
      setTimeout(() => { isSwiping.current = false; }, 0);
    }
    mouseStartXRef.current = null;
  };

  const handleClick = (banner) => {
    if (isSwiping.current) return;
    if (banner.click_url) {
      window.open(banner.click_url, '_blank');
    }
  };

  return (
    <div className="mb-2">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((banner, i) => (
            <img
              key={banner.id || i}
              src={banner.image_url}
              alt={banner.alt_text || '배너'}
              className={`w-full h-auto flex-shrink-0 ${banner.click_url ? 'cursor-pointer' : ''}`}
              draggable={false}
              onClick={() => handleClick(banner)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

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
  const { weather, library, loading } = usePortalData(isVisible);
  const [showWeatherAlarm, setShowWeatherAlarm] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');
  const [banners, setBanners] = useState([]);
  const [showWeatherDetail, setShowWeatherDetail] = useState(false);
  const [flippedNewsIds, setFlippedNewsIds] = useState(() => new Set());
  const scrollContainerRef = useRef(null);

  const showToast = (msg) => {
    setAlarmPopup(msg);
    setTimeout(() => setAlarmPopup(''), 1500);
  };

  const toggleNewsFlip = (id) => {
    setFlippedNewsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 소식 카드 한 줄(제목+기준/출처 | 기간 플립 + 알림설정) — 단일 카드와 그룹 카드 내부 행에서 공용으로 사용
  const renderNewsRow = (item, dday) => (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="font-black text-[0.95rem] text-text-main leading-snug">
          {item.title}
          <span className="ml-1">{ERICA_NEWS_CATEGORY_EMOJI[item.category]}</span>
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-text-hint/75 font-medium">
            {(() => {
              const d = new Date(item.verified_at);
              return `${d.getFullYear() % 100}/${d.getMonth() + 1}/${d.getDate()}`;
            })()} 기준
          </span>
          <span className="text-[10px] text-text-hint/75">·</span>
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-text-hint/75 hover:underline"
          >
            <ExternalLink size={9} />
            출처
          </a>
        </div>
      </div>

      <div className="w-px self-stretch bg-slate-300" />

      <div className="w-[35%] flex-shrink-0 flex flex-col items-center justify-center gap-2">
        <div
          className="w-full perspective-container cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
          style={{ height: 26 }}
          onClick={() => toggleNewsFlip(item.id)}
        >
          <div className={`flip-card-inner ${flippedNewsIds.has(item.id) ? 'flipped' : ''}`}>
            <div className="flip-card-front flex items-center justify-center">
              <span className="text-[21px] font-black text-text-main leading-tight whitespace-nowrap">
                {formatEricaNewsPeriod(item)}
              </span>
            </div>
            <div className="flip-card-back flex items-center justify-center">
              <span
                className={`text-[21px] font-black leading-tight whitespace-nowrap ${
                  dday.tone === 'urgent'
                    ? 'text-red-600'
                    : dday.tone === 'active'
                      ? 'text-blue-600'
                      : 'text-text-sub'
                }`}
              >
                {dday.label}
              </span>
            </div>
          </div>
        </div>
        <button
          className="flex items-center justify-center gap-1 h-6 px-1.5 rounded-full bg-slate-50 border border-slate-200 text-text-sub text-[10px] font-bold hover:bg-slate-100 active:scale-95 transition-all"
          onClick={() => showToast('알림 기능은 곧 추가돼요! 🐾')}
          aria-label="알림 설정"
        >
          <Bell size={11} />
          알림 설정
        </button>
      </div>
    </div>
  );

  // 모의수강신청/수강신청 그룹 섹션 전용 행 — 이모지·기준정보·출처 없이, 기간에 시간까지 표시
  // (박스 기준선 3.5:6.5, 시간 정보가 길어서 기간 쪽에 더 넓은 폭을 배정)
  const renderGroupNewsRow = (item) => (
    <div className="flex items-center gap-3">
      <div className="flex-[3] min-w-0 flex flex-col justify-center">
        <p className="font-black text-[0.95rem] text-text-main leading-snug">
          {item.title}
        </p>
      </div>

      <div className="flex-[6] min-w-0 flex items-center justify-start">
        <span className="text-[13px] font-black text-text-main leading-tight whitespace-nowrap">
          {formatEricaNewsPeriodWithTime(item)}
        </span>
      </div>

      <div className="flex-[1] flex-shrink-0 flex items-center justify-end">
        <button
          className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 border border-slate-200 text-text-sub hover:bg-slate-100 active:scale-95 transition-all"
          onClick={() => showToast('알림 기능은 곧 추가돼요! 🐾')}
          aria-label="알림 설정"
        >
          <Bell size={12} />
        </button>
      </div>
    </div>
  );

  // 종료된 항목은 숨기고, group_id가 없는 항목은 소식 캐러셀에, group_id가 같은 항목들은
  // (모의수강신청처럼) 별도 섹션에 하나의 박스로 묶어서 노출. 각각 마감 임박한 순으로 정렬
  const { ericaNewsSingles, ericaNewsGroups } = useMemo(() => {
    const now = Date.now();
    const entries = ericaNewsData
      .filter((item) => item.is_active && new Date(item.end_at).getTime() >= now)
      .map((item) => ({ item, dday: getEricaNewsDday(item, now) }));

    const singles = [];
    const groupsMap = new Map();

    entries.forEach((entry) => {
      const groupId = entry.item.group_id;
      if (!groupId) {
        singles.push(entry);
        return;
      }
      let group = groupsMap.get(groupId);
      if (!group) {
        group = { groupId, groupLabel: entry.item.group_label || entry.item.title, entries: [], sortKey: Infinity };
        groupsMap.set(groupId, group);
      }
      group.entries.push(entry);
      group.sortKey = Math.min(group.sortKey, new Date(entry.item.end_at).getTime());
    });

    singles.sort((a, b) => new Date(a.item.end_at) - new Date(b.item.end_at));

    const groups = Array.from(groupsMap.values());
    groups.forEach((g) => g.entries.sort((a, b) => new Date(a.item.end_at) - new Date(b.item.end_at)));
    groups.sort((a, b) => a.sortKey - b.sortKey);

    return { ericaNewsSingles: singles, ericaNewsGroups: groups };
  }, []);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (data && !error) {
          setBanners(data);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
      }
    }
    if (isVisible) {
      fetchBanners();
    }
  }, [isVisible]);

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

  // 시간별 예보 2D 아이콘 매핑
  function getHourlyIcon(code, hour) {
    const isNight = hour >= 20 || hour < 6;
    if (code <= 0) return isNight ? Moon : Sun;
    if (code <= 1) return isNight ? CloudMoon : CloudSun;
    if (code <= 2) return CloudSun;
    if (code <= 3) return Cloud;
    if (code <= 48) return CloudFog;
    if (code <= 67) return CloudRain;
    if (code <= 77) return CloudSnow;
    if (code <= 82) return CloudDrizzle;
    return CloudLightning;
  }

  // 해는 주황색, 구름은 흰색, 비는 파란색으로 아이콘 내부를 채움
  function getHourlyIconFill(Icon) {
    if (Icon === Sun) return '#f97316';
    if (Icon === Cloud || Icon === CloudSun || Icon === CloudMoon || Icon === CloudFog || Icon === CloudSnow) return '#ffffff';
    if (Icon === CloudRain || Icon === CloudDrizzle || Icon === CloudLightning) return '#3b82f6';
    return 'none';
  }

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

  return (
    <>
      <button
        className="fixed bottom-[calc(20px+64px+12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
        onClick={() => setShowWeatherAlarm(true)}
      >
        <Bell size={18} />
        날씨 알림 받기
      </button>
      {showWeatherAlarm && (
        <WeatherAlarmSettings onClose={(msg) => {
          setShowWeatherAlarm(false);
          if (msg) showToast(msg);
        }} />
      )}
      {alarmPopup && (
        <div className="fixed bottom-[calc(20px+64px+60px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[1000] whitespace-pre-line text-center copy-toast">
          {alarmPopup}
        </div>
      )}

      <div className="pb-24 relative [animation:slideUp_0.4s_ease-out]">
        {/* 1. 에리카 날씨 섹션 */}
        {(loading || weather) && (
          <section className="-mt-4 mb-2">
            {loading ? (
              <div className="rounded-card min-h-[180px] bg-slate-100 animate-pulse flex flex-col justify-between p-6">
                <div className="flex flex-col gap-3">
                  <div className="h-12 w-36 bg-slate-200 rounded-xl" />
                  <div className="h-4 w-28 bg-slate-200 rounded-full" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded-xl mt-6" />
              </div>
            ) : weather ? (
              <div className="rounded-card pt-6 px-6 pb-3 text-white relative overflow-hidden min-h-[180px] flex flex-col justify-start shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300" style={{
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

                    <div className="mt-3 bg-white/20 backdrop-blur-lg py-2.5 px-4 rounded-xl flex items-start text-sm font-bold leading-relaxed w-full border border-white/10">
                      <Sparkles size={15} className="mr-2 mt-[6px] flex-shrink-0 text-white/70" />
                      <span className="break-all flex-1">
                        <TypewriterText text={weather.message} isVisible={isVisible} />
                      </span>
                    </div>

                    <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${showWeatherDetail ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className={`overflow-hidden transition-opacity duration-200 ${showWeatherDetail ? 'opacity-100 delay-100' : 'opacity-0'}`}>
                        <div className="mt-3">
                          {weather.airQuality && (
                            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, minmax(min-content, 1fr))' }}>
                              {[
                                { label: '미세먼지', data: weather.airQuality.pm10, icon: Wind },
                                { label: '초미세', data: weather.airQuality.pm25, icon: Wind },
                                { label: '자외선', data: weather.airQuality.uv, icon: Sun }
                              ].map((item, idx) => (
                                <div key={idx} className="bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl py-3 px-2 flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-1">
                                    <item.icon size={12} className="text-white" strokeWidth={2.5} />
                                    <span className="text-[12px] text-white font-black uppercase tracking-widest">{item.label}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: item.data.color }}
                                    />
                                    <span className="text-[13px] font-black text-white whitespace-nowrap">{item.data.label}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 시간별 예보 스트립 (이전 12시간 ~ 이후 12시간 실시간 가로 윈도우 스크롤) */}
                          {renderedHourlyForecast.length > 0 && (
                            <div
                              ref={scrollContainerRef}
                              className="mt-3 bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl overflow-x-auto no-scrollbar"
                            >
                              <div className="flex" style={{ minWidth: 'max-content', padding: '10px 6px' }}>
                                {renderedHourlyForecast.map((h, idx) => {
                                  const isCurrent = h.isCurrent;
                                  const isPast = h.isPast;
                                  const HourlyIcon = getHourlyIcon(h.weatherCode, h.hour);
                                  return (
                                    <div
                                      key={idx}
                                      data-current={isCurrent}
                                      className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all duration-300 ${
                                        isCurrent
                                          ? 'bg-white/90 border border-slate-400 shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                                          : ''
                                      } ${isPast ? 'opacity-55' : 'opacity-100'}`}
                                      style={{ minWidth: '50px' }}
                                    >
                                      <span className={`text-[13px] font-bold ${isCurrent ? 'text-slate-700 font-extrabold' : 'text-white'}`}>
                                        {h.hour}시
                                      </span>
                                      <HourlyIcon size={20} strokeWidth={2} fill={getHourlyIconFill(HourlyIcon)} className={`my-0.5 ${isCurrent ? 'text-slate-700' : 'text-white'}`} />
                                      <span className={`text-[13px] font-black ${isCurrent ? 'text-slate-800' : 'text-white'}`}>{h.temp}°</span>
                                      {h.precipProb > 20 && (
                                        <span className={`text-[10px] font-bold ${isCurrent ? 'text-slate-600' : 'text-blue-100'}`}>{h.precipProb}%</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="mt-2 mx-auto flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 text-white/90 text-[11px] font-bold transition-all duration-200"
                      onClick={() => setShowWeatherDetail((v) => !v)}
                    >
                      {showWeatherDetail ? '접기' : '더보기'}
                      <ChevronDown size={14} className={`transition-transform duration-300 ${showWeatherDetail ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="absolute right-[-15px] top-[-15px] pointer-events-none transform rotate-12" style={{
                  color: weatherTheme.iconColor || '#ffffff',
                  opacity: weatherTheme.iconColor ? 0.22 : 0.15
                }}>
                  {weatherTheme.icon && React.createElement(weatherTheme.icon, { size: 160 })}
                </div>
              </div>
            ) : null}
          </section>
        )}

      {banners.length > 0 && <BannerCarousel banners={banners} />}

      {/* 2. 에리카 소식 섹션 */}
      {ericaNewsSingles.length > 0 && (
        <section className="mb-2">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1 -mx-5 px-5">
            {ericaNewsSingles.map(({ item, dday }) => (
              <div key={item.id} className="bg-white rounded-card border border-[#e2e8f0] px-4 py-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex-shrink-0 w-[88%] snap-center">
                {renderNewsRow(item, dday)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. 그룹 소식 섹션 (모의수강신청 등 group_id로 묶인 소식) */}
      {ericaNewsGroups.map((group) => (
        <section key={group.groupId} className="mb-2">
          <div className="flex items-center gap-1.5 mb-3">
            <h3 className="text-xl font-bold text-text-main">{group.groupLabel}</h3>
            <a
              href={group.entries[0].item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-text-hint/75 hover:underline"
            >
              <ExternalLink size={9} />
              출처
            </a>
          </div>
          <div className="bg-white rounded-card border border-[#e2e8f0] px-4 py-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col gap-3">
            {group.entries.map(({ item }, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <div className="border-b border-dashed border-slate-200" />}
                {renderGroupNewsRow(item)}
              </React.Fragment>
            ))}
          </div>
        </section>
      ))}

      {/* 4. 열람실 혼잡도 섹션 */}
      <section className="mb-2">
        <h3 className="text-xl font-bold text-text-main mb-3">열람실 혼잡도</h3>
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
                <div key={room.id} className="bg-white rounded-card border border-[#e2e8f0] p-3.5 flex flex-col gap-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="font-black text-[0.95rem] text-text-main leading-tight truncate flex-1 min-w-0">
                      {room.name.replace(' (2F)', '').replace(' (4F)', '')}
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0" style={{
                      backgroundColor: `${room.color}15`,
                      color: room.color,
                      border: `1px solid ${room.color}25`
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
