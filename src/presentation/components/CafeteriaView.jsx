// 컴포넌트: 날짜·식당 선택 및 아코디언 식단 목록 표시
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Clock, Bell, Share2 } from 'lucide-react';
import { getKSTDate } from '../../utils/time.js';
import { AlarmSettings } from './AlarmSettings.jsx';
import { ShareSheet } from './ShareSheet.jsx';

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
      // 텍스트 너비 + 1em 간격(≈16px) 기준
      setMarquee({ duration: Math.max(4, (span.scrollWidth + 16) / 30) });
    } else {
      setMarquee(null);
    }
  }, [html]);

  return (
    <div className="menu-item-line">
      {bullet && <span className="menu-item-bullet">{bullet}</span>}
      <div ref={scrollWrapRef} className="menu-item-scroll-wrap">
        <span
          ref={spanRef}
          className="menu-item-text"
          style={marquee ? { position: 'absolute', visibility: 'hidden', pointerEvents: 'none' } : undefined}
          dangerouslySetInnerHTML={{ __html: content }}
        />
        {marquee && (
          <span className="menu-item-marquee-track" style={{ animationDuration: `${marquee.duration}s` }}>
            <span className="menu-item-text menu-item-gap" dangerouslySetInnerHTML={{ __html: content }} />
            <span className="menu-item-text menu-item-gap" aria-hidden="true" dangerouslySetInnerHTML={{ __html: content }} />
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

export function CafeteriaView({ date, changeDate, cafes, loading }) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTypeRef = useRef(urlParams.get('type'));

  const [selectedCafeId, setSelectedCafeId] = useState(
    () => urlParams.get('cafe') || localStorage.getItem('lastSelectedCafeId') || 're12'
  );
  
  const handleCafeSelect = (id) => {
    setSelectedCafeId(id);
    localStorage.setItem('lastSelectedCafeId', id);
  };
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showAlarm, setShowAlarm] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const listRef = useRef(null);

  const selectedCafe = cafes.find(c => c.id === selectedCafeId) || { menus: [] };

  // 날짜 이동 후 선택된 식당에 메뉴가 없으면 메뉴 있는 식당으로 자동 전환
  useEffect(() => {
    if (!cafes.length) return;
    const current = cafes.find(c => c.id === selectedCafeId);
    if (!current?.menus?.length) {
      const fallback = cafes.find(c => c.menus?.length > 0);
      if (fallback) setSelectedCafeId(fallback.id);
    }
  }, [cafes]); // eslint-disable-line react-hooks/exhaustive-deps

  // URL 파라미터 한 번 읽은 후 히스토리 정리
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!selectedCafe.menus?.length) return;

    // URL ?type= 파라미터가 있으면 해당 끼니만 펼침
    const urlType = urlTypeRef.current;
    if (urlType) {
      const initial = {};
      selectedCafe.menus.forEach(m => {
        if (initial[m.type] === undefined) initial[m.type] = m.type === urlType;
      });
      setExpandedGroups(initial);
      urlTypeRef.current = null;

      setTimeout(() => {
        const targetEl = listRef.current?.querySelector(`[data-type="${CSS.escape(urlType)}"]`);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
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

    // 중식/석식 시간에 식당 선택 시 해당 섹션으로 자동 스크롤 (조식 제외)
    if (isToday && (targetType === '중식' || targetType === '석식')) {
      setTimeout(() => {
        const targetEl = listRef.current?.querySelector(`[data-type*="${targetType}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150); // 렌더링 및 애니메이션 대기
    }
  }, [selectedCafeId, cafes, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (type) =>
    setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));

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
    <div className="cafe-container">
      {createPortal(
        <>
          <button className="alarm-fab" onClick={() => setShowAlarm(true)}>
            <Bell size={18} />
            키워드 알림 받기
          </button>
          {showAlarm && <AlarmSettings onClose={() => setShowAlarm(false)} />}
        </>,
        document.body
      )}
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
      {copiedToast && <div className="copy-toast">링크 복사됨!</div>}
      <div className="cafe-sticky-header">
        <div className="date-controller">
          <button className="date-btn" onClick={() => changeDate(-1)} disabled={loading}>
            <ChevronLeft style={{ opacity: loading ? 0.3 : 1 }} />
          </button>
          <div className="date-text" style={{ opacity: loading ? 0.5 : 1 }}>{formatDate(date)}</div>
          <button className="date-btn" onClick={() => changeDate(1)} disabled={loading}>
            <ChevronRight style={{ opacity: loading ? 0.3 : 1 }} />
          </button>
        </div>

        <div
          className="cafe-selector"
          style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
        >
          {cafes.map(cafe => (
            <div
              key={cafe.id}
              className={`cafe-chip ${selectedCafeId === cafe.id ? 'active' : ''} ${!cafe.available ? 'disabled' : ''}`}
              onClick={() => handleCafeSelect(cafe.id)}
            >
              {cafe.name}
              {cafe.hasJeyuk && <span className="jeyuk-badge">🔥 제육</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="menu-list" ref={listRef} style={{ position: 'relative', minHeight: '200px' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 10, borderRadius: 'var(--radius-card)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div className="loader-spinner" style={{ width: '40px', height: '40px' }} />
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600' }}>식단 정보를 가져오는 중...</span>
          </div>
        )}

        <div style={{ filter: loading ? 'blur(2px)' : 'none', transition: 'filter 0.3s ease' }}>
          {cafes.length > 0 ? (
            Object.keys(groupedMenus).length > 0 ? (
              Object.entries(groupedMenus).map(([type, menus]) => {
                const isExpanded = expandedGroups[type];
                return (
                  <div key={type} className="accordion-group" data-type={type}>
                    {(() => {
                      const mealKey = ['조식', '중식', '석식'].find(k => type.includes(k));
                      const hoursText = mealKey ? selectedCafe.hours?.[mealKey] : null;
                      return (
                        <>
                          <div
                            className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => toggleGroup(type)}
                          >
                            <div className="accordion-title-area">
                              <span className="menu-icon">{getMenuIcon(type)}</span>
                              <span className="accordion-title">{type}</span>
                              <span className="accordion-count">{menus.length}개 메뉴</span>
                            </div>
                            <div className="accordion-chevron">
                              <ChevronRight
                                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                                size={20}
                                color="#94a3b8"
                              />
                            </div>
                          </div>
                          <div className={`accordion-content ${isExpanded ? 'expanded' : ''}`}>
                            <div className="accordion-inner">
                              {menus.map((m, i) => {
                                const hasJeyuk = m.menu.includes('제육');
                                const isCheonwon = type.includes('천원') || m.menu.includes('천원의아침밥');
                                const cardClass = `menu-card${hasJeyuk ? ' menu-card--jeyuk' : ''}`;
                                const shareUrl = `${window.location.origin}/?date=${date.toISOString().split('T')[0]}&cafe=${selectedCafeId}&type=${encodeURIComponent(type)}`;
                                const dateLabel = `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;
                                const menuLines = m.menu.split('\n').filter(line => !line.includes('천원의아침밥'));
                                return (
                                  <div key={i} className={cardClass}>
                                    {m.price && (
                                      <div className={`menu-price${isCheonwon ? ' menu-price--cheonwon' : ''}`}>
                                        {isCheonwon ? `${m.price}💕` : m.price}
                                      </div>
                                    )}
                                    <div className="menu-items">
                                      {menuLines.map((line, idx) => (
                                        <MenuItemLine key={idx} html={line} />
                                      ))}
                                    </div>
                                    <div className="menu-card-footer">
                                      {hoursText ? (
                                        <div className="menu-hours">
                                          <Clock size={12} />
                                          <span>{hoursText}</span>
                                        </div>
                                      ) : <span />}
                                      <button
                                        className="menu-card-share-btn"
                                        onClick={() => setShareTarget({ type, menu: m, shareUrl, dateLabel })}
                                        aria-label="메뉴 공유"
                                      >
                                        <Share2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                );
              })
            ) : (
              <div className="no-menu">해당 식당은 오늘 등록된 메뉴가 없습니다.</div>
            )
          ) : !loading && (
            <div className="no-menu">정보를 불러올 수 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
