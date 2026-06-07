// 컴포넌트: 날짜·식당 선택 및 아코디언 식단 목록 표시
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

import { ChevronLeft, ChevronRight, Clock, Bell, Share2 } from 'lucide-react';
import { getKSTDate } from '../../utils/time.js';
import { AlarmSettings } from './AlarmSettings.jsx';
import { ShareSheet } from './ShareSheet.jsx';

function parseBoldText(text) {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return parts.map((part, index) => {
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      const innerText = part.slice(3, -4);
      return <strong key={index} className="font-bold">{innerText}</strong>;
    }
    return part;
  });
}

function MenuItemLine({ html }) {
  const scrollWrapRef = useRef(null);
  const spanRef = useRef(null);
  const [marquee, setMarquee] = useState(null);

  const hasBullet = html.startsWith('•');
  const bullet  = hasBullet ? '•' : '';
  const content = hasBullet ? html.slice(1).trimStart() : html;

  useLayoutEffect(() => {
    const wrap = scrollWrapRef.current;
    const span = spanRef.current;
    if (!wrap || !span) return;
    const dist = span.scrollWidth - wrap.clientWidth;
    if (dist > 2) {
      setMarquee({ duration: Math.max(4, (span.scrollWidth + 16) / 30) });
    } else {
      setMarquee(null);
    }
  }, [html]);

  const parsedContent = parseBoldText(content);

  return (
    <div className="flex items-baseline whitespace-nowrap leading-[1.8]">
      {bullet && <span className="flex-shrink-0 mr-[0.4rem]">{bullet}</span>}
      <div ref={scrollWrapRef} className="overflow-hidden flex-1 min-w-0">
        <span
          ref={spanRef}
          className="inline-block"
          style={marquee ? { position: 'absolute', visibility: 'hidden', pointerEvents: 'none' } : undefined}
        >
          {parsedContent}
        </span>
        {marquee && (
          <span className="menu-item-marquee-track" style={{ animationDuration: `${marquee.duration}s` }}>
            <span className="inline-block menu-item-gap">{parsedContent}</span>
            <span className="inline-block menu-item-gap" aria-hidden="true">{parsedContent}</span>
          </span>
        )}
      </div>
    </div>
  );
}

const formatDate = (targetDate) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = targetDate.getUTCMonth() + 1;
  const day   = targetDate.getUTCDate();
  const base  = `${month}월 ${day}일 (${days[targetDate.getUTCDay()]})`;

  const nowKst    = getKSTDate();
  const todayStr  = nowKst.toISOString().split('T')[0];
  const targetStr = targetDate.toISOString().split('T')[0];
  if (todayStr === targetStr) return `${base} 오늘`;

  const tmr = new Date(nowKst.getTime() + 86400000);
  if (tmr.toISOString().split('T')[0] === targetStr) return `${base} 내일`;

  const yst = new Date(nowKst.getTime() - 86400000);
  if (yst.toISOString().split('T')[0] === targetStr) return `${base} 어제`;

  return base;
};

const getMenuIcon = (type) => {
  if (type.includes('조식')) return '☀️';
  if (type.includes('중식') || type.includes('일품') || type.includes('분식')) return '🍴';
  if (type.includes('석식')) return '🌙';
  if (type.includes('천원')) return '💰';
  return '🍚';
};

export function CafeteriaView({ date, changeDate, cafes, cafesDate, loading, cafeDeepLink, onCafeDeepLinkHandled }) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTypeRef = useRef(urlParams.get('type'));
  const rootRef = useRef(null);

  const scrollToTop = useCallback(() => {
    let node = rootRef.current?.parentNode;
    while (node) {
      const style = window.getComputedStyle(node);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        node.scrollTop = 0;
        return;
      }
      node = node.parentNode;
    }
  }, []);

  const [selectedCafeId, setSelectedCafeId] = useState(
    () => urlParams.get('cafe') || localStorage.getItem('lastSelectedCafeId') || 're12'
  );

  const selectedCafe = selectedCafeId === 'all'
    ? {
        id: 'all',
        name: '전체',
        menus: cafes.reduce((acc, c) => {
          if (!c.available || !c.menus) return acc;
          return acc.concat(c.menus.map(m => ({ ...m, cafeName: c.name, cafeId: c.id })));
        }, []),
        hours: {}
      }
    : (cafes.find(c => c.id === selectedCafeId) || { menus: [] });

  const handleCafeSelect = (id) => {
    setSelectedCafeId(id);
    localStorage.setItem('lastSelectedCafeId', id);
    scrollToTop();
  };

  const handleCafeDetailNavigate = (cafeId, mealType) => {
    urlTypeRef.current = mealType;
    setSelectedCafeId(cafeId);
    localStorage.setItem('lastSelectedCafeId', cafeId);
    scrollToTop();
  };

  const [expandedGroups, setExpandedGroups] = useState({});
  const [deepLinkTrigger, setDeepLinkTrigger] = useState(0);
  const [showAlarm, setShowAlarm] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [alarmPopup, setAlarmPopup] = useState('');
  const listRef = useRef(null);

  // 식당 자동 선택 및 메뉴 유무 확인
  useEffect(() => {
    if (!cafes.length) return;
    if (selectedCafeId === 'all') return;
    const current = cafes.find(c => c.id === selectedCafeId);
    if (!current?.menus?.length) {
      const fallback = cafes.find(c => c.menus?.length > 0);
      if (fallback) setSelectedCafeId(fallback.id);
    }
  }, [cafes, selectedCafeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 딥링크 처리: 날짜 동기화
  useEffect(() => {
    const urlDate = urlParams.get('date');
    if (urlDate) {
      const parsed = new Date(urlDate);
      if (!isNaN(parsed) && urlDate !== date.toISOString().split('T')[0]) {
        changeDate(parsed);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 딥링크 처리: 파라미터 제거 (모든 연동 준비 후)
  useEffect(() => {
    if (window.location.search) {
      const t = setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 1000); // 넉넉히 1초 후 제거
      return () => clearTimeout(t);
    }
  }, []);

  // 네이티브 알림 탭 딥링크: App에서 전달된 파라미터 처리
  useEffect(() => {
    if (!cafeDeepLink) return;
    const { date: dateStr, cafe: cafeId, type: mealType } = cafeDeepLink;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed)) changeDate(parsed);
    }
    if (cafeId) {
      setSelectedCafeId(cafeId);
      localStorage.setItem('lastSelectedCafeId', cafeId);
    }
    if (mealType) {
      urlTypeRef.current = mealType;
    }
    setDeepLinkTrigger(t => t + 1);
    onCafeDeepLinkHandled?.();
  }, [cafeDeepLink]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCafe.menus?.length) return;

    const urlType = urlTypeRef.current;
    if (urlType) {
      // cafes가 현재 date와 일치하는 날짜 데이터인지 확인 (stale 캐시/응답 방지)
      const expectedDateStr = date.toISOString().split('T')[0];
      if (cafesDate !== expectedDateStr) return;

      const initial = {};
      let foundExact = false;

      selectedCafe.menus.forEach(m => {
        // 정확히 일치하거나, 포함되어 있는 경우 (예: "중식" vs "중식 (학식)")
        const match = m.type === urlType || m.type.includes(urlType) || urlType.includes(m.type);
        if (initial[m.type] === undefined) {
          initial[m.type] = match;
          if (match) foundExact = true;
        }
      });

      setExpandedGroups(initial);
      urlTypeRef.current = null;

      if (foundExact) {
        setTimeout(() => {
          // 정확히 일치하는 data-type을 찾거나, 포함하는 요소를 찾음
          const targetEl = listRef.current?.querySelector(`[data-type="${CSS.escape(urlType)}"]`) ||
                          listRef.current?.querySelector(`[data-type*="${urlType}"]`);
          if (targetEl) {
            // scrollIntoView로 실제 스크롤 컨테이너(overflow-y-auto div)를 스크롤
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
      return;
    }

    const nowKst = getKSTDate();
    const isToday = nowKst.toISOString().split('T')[0] === date.toISOString().split('T')[0];
    const h = nowKst.getUTCHours();

    const getTargetType = () => {
      if (h < 9) return '조식';
      if (h >= 14) return '석식';
      return '중식';
    };

    const targetType = getTargetType();
    const hasTarget = selectedCafe.menus.some(m => m.type.includes(targetType));

    const getOpen = (type) => {
      if (!isToday || !hasTarget) return true;
      if (h < 9) return type.includes('조식');
      if (h >= 14) return type.includes('석식');
      return !type.includes('조식') && !type.includes('석식');
    };

    const initial = {};
    selectedCafe.menus.forEach(m => {
      if (initial[m.type] === undefined) initial[m.type] = getOpen(m.type);
    });
    setExpandedGroups(initial);

    if (isToday && (targetType === '중식' || targetType === '석식')) {
      setTimeout(() => {
        const targetEl = listRef.current?.querySelector(`[data-type*="${targetType}"]`);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [selectedCafeId, cafes, cafesDate, date, deepLinkTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (type) =>
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));

  const isDateStale = cafesDate !== date.toISOString().split('T')[0];

  const groupedMenus = selectedCafe.menus.reduce((acc, m) => {
    if (!acc[m.type]) acc[m.type] = [];
    acc[m.type].push(m);
    return acc;
  }, {});

  const handleCopied = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div ref={rootRef} className="pb-20 relative">
      <button
        className="fixed bottom-[calc(20px+64px+12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 h-10 px-3 bg-[rgba(15,23,42,0.72)] backdrop-blur-[20px] text-surface border border-white/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-[999] whitespace-nowrap text-[0.78rem] font-medium font-[inherit] transition-all duration-200 hover:scale-[1.04] hover:bg-[rgba(15,23,42,0.88)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.45)] active:scale-[0.97]"
        onClick={() => setShowAlarm(true)}
      >
        <Bell size={18} />
        학식 알림 받기
      </button>
      {showAlarm && <AlarmSettings onClose={(msg) => {
        setShowAlarm(false);
        if (msg) {
          setAlarmPopup(msg);
          setTimeout(() => setAlarmPopup(''), 1500);
        }
      }} />}
      {shareTarget && (
        <ShareSheet
          cafeName={selectedCafe.name}
          dateText={formatDate(date)}
          mealType={shareTarget.type}
          menuText={shareTarget.menu.menu}
          dateLabel={shareTarget.dateLabel}
          shareUrl={shareTarget.shareUrl}
          onClose={() => setShareTarget(null)}
          onCopied={handleCopied}
        />
      )}
      {copiedToast && (
        <div className="copy-toast fixed bottom-[calc(20px+64px+52px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.88)] text-white text-[0.78rem] font-semibold px-4 py-2 rounded-full whitespace-nowrap z-[2000] pointer-events-none">
          링크 복사됨!
        </div>
      )}
      {alarmPopup && (
        <div className="fixed bottom-[calc(20px+64px+60px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.85)] text-white text-[0.78rem] font-medium px-4 py-2 rounded-full z-[1000] whitespace-pre-line text-center copy-toast">
          {alarmPopup}
        </div>
      )}

      {/* 고정 헤더 */}
      {/* 고정 헤더: 날짜 및 식당 선택 */}
      <div className="sticky top-0 z-[100] bg-surface/90 backdrop-blur-xl pt-4 pb-4 -mx-5 px-5 mb-4 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex justify-between items-center mb-3 bg-white px-5 py-3 rounded-card border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
          <button
            className="bg-none border-none text-text-sub cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 hover:text-text-main"
            onClick={() => changeDate(-1)}
            disabled={loading}
          >
            <ChevronLeft style={{ opacity: loading ? 0.3 : 1 }} />
          </button>
          <div className="text-[1.1rem] font-bold text-text-main font-['Outfit',sans-serif]" style={{ opacity: loading ? 0.5 : 1 }}>
            {formatDate(date)}
          </div>
          <button
            className="bg-none border-none text-text-sub cursor-pointer p-1 flex items-center justify-center transition-colors duration-200 hover:text-text-main"
            onClick={() => changeDate(1)}
            disabled={loading}
          >
            <ChevronRight style={{ opacity: loading ? 0.3 : 1 }} />
          </button>
        </div>

        <div
          className="flex gap-1.5 pt-2.5 overflow-x-auto no-scrollbar scroll-smooth"
          style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
        >
          {/* 전체 조회 탭 */}
          <div
            className={`flex-shrink-0 py-2 border rounded-card text-[clamp(0.65rem,3.1vw,0.82rem)] font-semibold cursor-pointer transition-all duration-200 relative flex items-center justify-center gap-[0.3rem] whitespace-nowrap overflow-visible [-webkit-tap-highlight-color:transparent] ${
              selectedCafeId === 'all'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white border-[#e2e8f0] text-text-sub hover:border-primary hover:text-primary'
            }`}
            style={{ paddingLeft: '18px', paddingRight: '18px' }}
            onClick={() => handleCafeSelect('all')}
          >
            전체
          </div>

          {cafes.map(cafe => (
            <div
              key={cafe.id}
              className={`flex-shrink-0 py-2 border rounded-card text-[clamp(0.65rem,3.1vw,0.82rem)] font-semibold cursor-pointer transition-all duration-200 relative flex items-center justify-center gap-[0.3rem] whitespace-nowrap overflow-visible [-webkit-tap-highlight-color:transparent] ${
                selectedCafeId === cafe.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : !cafe.available
                    ? 'bg-white border-[#e2e8f0] text-text-sub opacity-30'
                    : 'bg-white border-[#e2e8f0] text-text-sub hover:border-primary hover:text-primary'
              }`}
              style={{ paddingLeft: '13px', paddingRight: '13px' }}
              onClick={() => handleCafeSelect(cafe.id)}
            >
              {cafe.name}
              {cafe.hasJeyuk && (
                <span className="absolute top-[-8px] right-[-5px] bg-error text-white text-[0.65rem] px-1.5 py-0.5 rounded font-extrabold shadow-[0_2px_8px_rgba(239,68,68,0.4)]">
                  🔥 제육
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 메뉴 목록 */}
      <div ref={listRef} style={{ position: 'relative', minHeight: '200px' }}>
        {loading && !isDateStale && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 10, borderRadius: 'var(--radius-card)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div className="w-10 h-10 border-[3px] border-white/10 rounded-full border-t-primary animate-[spin_0.8s_linear_infinite] mb-4" />
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600' }}>식단 정보를 가져오는 중...</span>
          </div>
        )}

        <div style={{ filter: (loading && !isDateStale) ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease' }}>
          {loading || isDateStale ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-[3px] border-slate-200 rounded-full border-t-primary animate-[spin_0.8s_linear_infinite]" />
              <span className="text-xs font-semibold text-text-sub">식단 정보를 가져오는 중...</span>
            </div>
          ) : cafes.length > 0 ? (
            Object.keys(groupedMenus).length > 0 ? (
              Object.entries(groupedMenus).map(([type, menus]) => {
                const isExpanded = expandedGroups[type];
                return (
                  <div key={type} className="mb-[0.6rem]" data-type={type} style={{ scrollMarginTop: '140px' }}>
                    {(() => {
                      const mealKey = ['조식', '중식', '석식'].find(k => type.includes(k));
                      const hoursText = mealKey ? selectedCafe.hours?.[mealKey] : null;
                      return (
                        <>
                          <div
                            className="flex justify-between items-center px-5 py-4 bg-white rounded-card border border-[#e2e8f0] cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all duration-200 mb-[0.4rem] hover:bg-surface hover:border-[#cbd5e1]"
                            onClick={() => toggleGroup(type)}
                          >
                            <div className="flex items-center gap-3">
                               <span className="text-xl">{getMenuIcon(type)}</span>
                               <span className="font-extrabold text-[1.05rem] text-text-main">{type}</span>
                               <span className="text-xs font-bold text-white bg-hyu-blue-light px-2 py-0.5 rounded-card">
                                 {menus.length}개 메뉴
                               </span>
                            </div>
                            <ChevronRight
                              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                              size={20}
                              color="#94a3b8"
                            />
                          </div>
                          <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                            <div className="accordion-inner">
                              {selectedCafeId === 'all' ? (
                                <div className="bg-white rounded-card border border-[#e2e8f0] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] text-left flex flex-col overflow-hidden w-full">
                                  {(() => {
                                    const cafeGroups = {};
                                    menus.forEach(m => {
                                      if (!cafeGroups[m.cafeId]) {
                                        cafeGroups[m.cafeId] = {
                                          cafeId: m.cafeId,
                                          cafeName: m.cafeName,
                                          items: []
                                        };
                                      }
                                      cafeGroups[m.cafeId].items.push(m);
                                    });
                                    return Object.values(cafeGroups).map((group, groupIdx) => (
                                      <div
                                        key={group.cafeId}
                                        className={`group p-5 flex flex-col gap-3 transition-colors duration-150 hover:bg-slate-50 cursor-pointer active:bg-slate-100 ${groupIdx > 0 ? 'border-t border-[#f1f5f9]' : ''}`}
                                        onClick={() => handleCafeDetailNavigate(group.cafeId, type)}
                                      >
                                        <div className="flex items-center justify-between pb-1">
                                          <span className="text-[14px] font-black text-primary">
                                            {group.cafeName}
                                          </span>
                                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center transition-colors duration-150 group-hover:bg-primary group-hover:text-white group-hover:border-primary">
                                            <ChevronRight size={13} strokeWidth={3} />
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-2 pl-1 pr-1">
                                          {group.items.map((item, idx) => {
                                            const menuLines = item.menu.split('\n')
                                              .filter(line => !line.includes('천원의아침밥') && line.trim() !== '');
                                            const processedLines = menuLines.map((line, lineIdx) => {
                                              let cleaned = line;
                                              if (lineIdx > 0) {
                                                cleaned = cleaned.replace(/<\/?b>/g, '');
                                                if (cleaned.startsWith('•')) {
                                                  cleaned = cleaned.slice(1).trimStart();
                                                }
                                              }
                                              return cleaned;
                                            });
                                            const joinedMenu = processedLines.join(', ');
                                            return (
                                              <div key={idx} className="flex items-baseline justify-between text-[0.93rem] text-text-main gap-3">
                                                <div className="flex-1 min-w-0 font-normal text-left truncate">
                                                  {joinedMenu.startsWith('•') ? (
                                                    <>
                                                      <span className="mr-[0.4rem]">•</span>
                                                      {parseBoldText(joinedMenu.slice(1).trimStart())}
                                                    </>
                                                  ) : (
                                                    parseBoldText(joinedMenu)
                                                  )}
                                                </div>
                                                {item.price && (
                                                  <span className="flex-shrink-0 text-[11px] font-bold text-text-sub">
                                                    {item.price}
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              ) : (
                                menus.map((m, i) => {
                                  const isCheonwon = type.includes('천원') || m.menu.includes('천원의아침밥');
                                  const shareUrl = `${window.location.origin}/?date=${date.toISOString().split('T')[0]}&cafe=${selectedCafeId}&type=${encodeURIComponent(type)}`;
                                  const nowKst = getKSTDate();
                                  const targetStr = date.toISOString().split('T')[0];
                                  const dateLabel = targetStr === nowKst.toISOString().split('T')[0] ? '오늘'
                                    : targetStr === new Date(nowKst.getTime() + 86400000).toISOString().split('T')[0] ? '내일'
                                    : targetStr === new Date(nowKst.getTime() - 86400000).toISOString().split('T')[0] ? '어제'
                                    : `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;
                                  const menuLines = m.menu.split('\n').filter(line => !line.includes('천원의아침밥'));
                                  return (
                                    <div
                                      key={i}
                                      className="menu-card bg-white rounded-card p-6 border border-[#e2e8f0] text-left transition-transform duration-200 relative active:scale-[0.98] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]"
                                    >
                                      {m.price && (
                                        <div className="absolute top-5 right-5 text-primary font-bold text-[0.9rem] bg-[rgba(14,74,132,0.06)] px-2.5 py-1 rounded z-[1]">
                                          {isCheonwon ? `${m.price}💕` : m.price}
                                        </div>
                                      )}
                                      <div className="text-[0.95rem] text-text-main pl-1 pr-[6.5rem]" data-menu-content>
                                        {menuLines.map((line, idx) => (
                                          <MenuItemLine key={idx} html={line} />
                                        ))}
                                      </div>
                                      <div className="flex justify-between items-center mt-[0.6rem] pt-[0.6rem] pl-[0.2rem] border-t border-[#e2e8f0]">
                                        {hoursText ? (
                                          <div className="flex items-center gap-1 text-xs text-text-hint">
                                            <Clock size={12} />
                                            <span>{hoursText}</span>
                                          </div>
                                        ) : <span />}
                                        <button
                                          className="flex items-center justify-center flex-shrink-0 w-9 h-9 border-none bg-[#f1f5f9] rounded-full text-text-sub cursor-pointer transition-all duration-150 hover:bg-[#e2e8f0] active:scale-90"
                                          onClick={() => setShareTarget({ type, menu: m, shareUrl, dateLabel })}
                                          aria-label="메뉴 공유"
                                        >
                                          <Share2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 px-4 text-text-sub">해당 식당은 오늘 등록된 메뉴가 없습니다.</div>
            )
          ) : (
            <div className="text-center py-12 px-4 text-text-sub">정보를 불러올 수 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
