// 컴포넌트: 단과대 제휴 업체 검색 및 혜택 조회
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronUp, ExternalLink, Info, Clock } from 'lucide-react';
import partnershipsData from '../../data/partnerships.json';

// ─── 카테고리 enum (데이터 스키마 기준) ───
const CATEGORIES = [
  { key: 'all',  label: '전체',    emoji: '📋' },
  { key: 'food', label: '식당',    emoji: '🍽️' },
  { key: 'cafe', label: '카페',    emoji: '☕' },
  { key: 'pub',  label: '주점',    emoji: '🍺' },
  { key: 'play', label: '여가',    emoji: '🎮' },
  { key: 'life', label: '생활',    emoji: '✂️' },
];

// ─── 단과대 목록 ───
const COLLEGES = [
  { id: 'all', name: '전체' },
  { id: '1',   name: 'LIONS 칼리지' },
  { id: '2',   name: '커뮤니케이션&컬쳐대학' },
  { id: '3',   name: '공학대학' },
  { id: '4',   name: '약학대학' },
  { id: '5',   name: '디자인대학' },
  { id: '6',   name: '글로벌문화통상대학' },
  { id: '7',   name: '경상대학' },
  { id: '8',   name: '소프트웨어융합대학' },
  { id: '9',   name: '예체능대학' },
  { id: '10',  name: '첨단융합대학' },
  { id: '11',  name: '총학생회' },
];

// 단과대별 이모지
const COLLEGE_EMOJI = {
  '1': '🦁',   // LIONS 칼리지
  '2': '📢',   // 커뮤니케이션&컬쳐대학
  '3': '⚙️',   // 공학대학
  '4': '💊',   // 약학대학
  '5': '🎨',   // 디자인대학
  '6': '🌍',   // 글로벌문화통상대학
  '7': '📊',   // 경상대학
  '8': '💻',   // 소프트웨어융합대학
  '9': '🎵',   // 예체능대학
  '10': '🚀',  // 첨단융합대학
  '11': '👥',  // 총학생회
};

// 단과대별 색상 스타일
const COLLEGE_STYLE = {
  '1': 'bg-[rgba(254,215,170,0.5)] text-[#1f2937]',    // LIONS 칼리지 - 주황 (🦁)
  '2': 'bg-[rgba(254,202,202,0.5)] text-[#1f2937]',    // 커뮤니케이션 - 빨강 (📢)
  '3': 'bg-[rgba(229,231,235,0.6)] text-[#1f2937]',    // 공학대학 - 회색 (⚙️)
  '4': 'bg-[rgba(254,226,226,0.5)] text-[#1f2937]',    // 약학대학 - 빨강 (💊)
  '5': 'bg-[rgba(233,213,255,0.5)] text-[#1f2937]',    // 디자인대학 - 보라 (🎨)
  '6': 'bg-[rgba(187,247,208,0.5)] text-[#1f2937]',    // 글로벌 - 초록 (🌍)
  '7': 'bg-[rgba(254,240,138,0.5)] text-[#1f2937]',    // 경상대학 - 노랑 (📊)
  '8': 'bg-[rgba(191,219,254,0.5)] text-[#1f2937]',    // 소프트웨어 - 파랑 (💻)
  '9': 'bg-[rgba(251,207,232,0.5)] text-[#1f2937]',    // 예체능대학 - 분홍 (🎵)
  '10': 'bg-[rgba(254,215,170,0.5)] text-[#1f2937]',   // 첨단융합 - 주황 (🚀)
  '11': 'bg-[rgba(219,234,254,0.6)] text-[#1f2937]',   // 총학생회 - 파랑 (👥)
};

const COLLEGE_DISPLAY_NAME = {
  '1': 'LIONS\n칼리지',
  '6': '글로벌문화\n통상대학',
  '8': '소프트웨어\n융합대학',
};

// 카테고리별 이모지 (카드 좌측 아이콘용)
const CATEGORY_EMOJI = {
  food: '🍽️', cafe: '☕', pub: '🍺', play: '🎮', life: '✂️',
};

function StoreCard({ store, collegeFilter }) {
  const [expanded, setExpanded] = useState(false);
  const activePartnerships = store.partnerships.filter(p => p.period?.is_active);
  // 단과대 필터가 걸려있으면 해당 단과대 제휴만 표시
  const displayedPartnerships = collegeFilter !== 'all'
    ? activePartnerships.filter(p => p.college_id === collegeFilter)
    : activePartnerships;
  const uniqueColleges = [...new Map(activePartnerships.map(p => [p.college_id, p])).values()];

  return (
    <div
      className={`bg-white border rounded-card overflow-hidden transition-all duration-200 ${
        expanded ? 'border-[#0E4A84]/20 shadow-[0_4px_12px_rgba(0,0,0,0.06)]' : 'border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* 헤더 */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left [-webkit-tap-highlight-color:transparent] active:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* 업체 이모지 */}
        <span className="text-xl flex-shrink-0">{store.emoji || '🏪'}</span>

        {/* 업체명 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-extrabold text-text-main truncate">{store.name}</span>
            {!store.is_active && (
              <span className="text-[9px] font-bold px-1 py-px rounded bg-red-50 text-red-400 border border-red-100">폐업</span>
            )}
          </div>
        </div>

        {/* 단과대 카운트 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {uniqueColleges.length === 1 ? (
            <span className="text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">{uniqueColleges[0].college_name}</span>
          ) : (
            <span className="text-[10px] font-bold text-white bg-hyu-blue-light px-1.5 py-0.5 rounded-full">{uniqueColleges.length}개 단과대</span>
          )}
        </div>

        {/* 화살표 */}
        {expanded
          ? <ChevronUp size={16} className="text-text-hint flex-shrink-0" />
          : <ChevronDown size={16} className="text-text-hint flex-shrink-0" />
        }
      </button>

      {/* 상세 내용 */}
      <div className="accordion-content" style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="px-4 pb-3.5 space-y-2.5">
            <div className="border-t border-[#f1f5f9]" />

            {displayedPartnerships.map((p, idx) => (
              <div
                key={`${p.college_id}-${idx}`}
                className="flex items-center gap-3 bg-surface rounded-xl p-4"
              >
                {/* 좌측: 단과대 라벨 */}
                <div className={`flex-shrink-0 w-[70px] flex flex-col items-center justify-center rounded-lg px-1.5 py-4 text-center gap-1 ${COLLEGE_STYLE[p.college_id]}`}>
                  <span className="text-[20px] leading-none">
                    {COLLEGE_EMOJI[p.college_id]}
                  </span>
                  <span className="text-[11px] font-extrabold leading-tight break-words whitespace-pre-line">
                    {COLLEGE_DISPLAY_NAME[p.college_id] ?? p.college_name}
                  </span>
                </div>

                {/* 우측: 혜택, 조건, 기간 */}
                <div className="flex-1 min-w-0">
                  {/* 혜택 */}
                  <p className="text-[12px] text-text-main font-semibold leading-[1.65] whitespace-pre-line mb-1">{p.benefit}</p>

                  {/* 조건 */}
                  {p.conditions && (
                    <div className="flex items-start gap-1 mt-1">
                      <Info size={10} className="text-text-hint mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-text-hint leading-[1.5] font-medium">{p.conditions}</p>
                    </div>
                  )}

                  {/* 기간 + 출처 */}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-text-hint flex-shrink-0" />
                      <span className="text-[10px] text-text-hint font-medium">
                        {p.period?.start_date?.slice(2).replace(/-/g, '.')} ~ {p.period?.end_date?.slice(2).replace(/-/g, '.')}
                      </span>
                    </div>
                    {p.source_url && (
                      <a
                        href={p.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-text-hint hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={9} />
                        출처
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PartnershipView({ isActive }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [college, setCollege] = useState(() => localStorage.getItem('partnerCollegeFilter') || 'all');
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const chipRowRef = useRef(null);

  useEffect(() => {
    if (!isActive || !chipRowRef.current) return;
    const activeChip = chipRowRef.current.querySelector('[data-college-active="true"]');
    activeChip?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' });
  }, [isActive]);

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

  const handleCollegeChange = useCallback((id) => {
    setCollege(id);
    localStorage.setItem('partnerCollegeFilter', id);
    scrollToTop();
  }, [scrollToTop]);

  const handleCategoryChange = useCallback((key) => {
    setCategory(key);
    scrollToTop();
  }, [scrollToTop]);

  // 검색 + 카테고리 + 단과대 필터링
  const filtered = useMemo(() => {
    let list = partnershipsData.filter(s => s.is_active);

    if (category !== 'all') {
      list = list.filter(s => s.category === category);
    }

    // 단과대 필터: 해당 단과대 제휴가 있는 업체만
    if (college !== 'all') {
      list = list.filter(s =>
        s.partnerships.some(p => p.college_id === college && p.period?.is_active)
      );
    }

    if (query.trim()) {
      // 띄어쓰기 무관 검색 (공백 제거 후 비교):
      // 현재 제휴 업체 데이터셋 규모가 작아(수백 개 수준) 실시간 공백 제거 정규식 연산의 성능 오버헤드가 무시할 수 있을 정도로 작아 채택함.
      const q = query.trim().replace(/\s+/g, '').toLowerCase();
      list = list.filter(s =>
        s.name.replace(/\s+/g, '').toLowerCase().includes(q) ||
        s.summary_benefit?.replace(/\s+/g, '').toLowerCase().includes(q) ||
        s.partnerships.some(p =>
          p.college_name?.replace(/\s+/g, '').toLowerCase().includes(q) ||
          p.benefit?.replace(/\s+/g, '').toLowerCase().includes(q)
        )
      );
    }

    return list.sort((a, b) => {
      const aCount = new Set(a.partnerships.filter(p => p.period?.is_active).map(p => p.college_id)).size;
      const bCount = new Set(b.partnerships.filter(p => p.period?.is_active).map(p => p.college_id)).size;
      if (bCount !== aCount) return bCount - aCount;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [query, category, college]);

  const clearSearch = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const selectedCollegeName = COLLEGES.find(c => c.id === college)?.name;
  const selectedCategoryLabel = CATEGORIES.find(c => c.key === category)?.label;

  return (
    <div ref={rootRef} className="pb-20 [animation:slideUp_0.4s_ease-out]">
      {/* 고정 헤더 */}
      <div className="sticky top-0 z-[100] bg-surface/90 backdrop-blur-xl pt-4 pb-3 -mx-5 px-5 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        {/* 검색 바 */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2.5 bg-white border border-[#e2e8f0] rounded-card px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
            <Search size={16} className="text-text-hint flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="제휴업체, 혜택, 단과대로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-text-main placeholder-text-hint outline-none font-semibold"
            />
            {query && (
              <button onClick={clearSearch} className="flex-shrink-0 [-webkit-tap-highlight-color:transparent] active:scale-90 transition-transform">
                <X size={16} className="text-text-hint" />
              </button>
            )}
          </div>
        </div>

        {/* 단과대 칩 */}
        <div className="mb-1">
          <div ref={chipRowRef} className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
            {COLLEGES.filter(c => c.id !== '11').map(c => (
              <button
                key={c.id}
                data-college-active={college === c.id}
                onClick={() => handleCollegeChange(c.id)}
                className={`flex items-center gap-1 px-3 py-[7px] rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
                  college === c.id
                    ? 'bg-[#0E4A84] text-white border-[#0E4A84]'
                    : 'bg-white text-[#334155] border-[#cbd5e1]'
                }`}
              >
                {c.id !== 'all' && COLLEGE_EMOJI[c.id]} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 칩 */}
        <div className="mb-1">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`flex items-center gap-1 px-3 py-[7px] rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
                  category === cat.key
                    ? 'bg-primary text-white border-primary shadow-[0_2px_6px_rgba(14,74,132,0.25)]'
                    : 'bg-white text-[#334155] border-[#cbd5e1]'
                }`}
              >
                {cat.key !== 'all' && <span className="text-[11px] leading-none">{cat.emoji}</span>}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 결과 카운트 */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-hint font-semibold">
            제휴업체 {filtered.length}개
            {college !== 'all' && <span className="text-primary"> · {selectedCollegeName}</span>}
            {category !== 'all' && <span className="text-primary"> · {selectedCategoryLabel}</span>}
            {query && <span className="text-primary"> · "{query}"</span>}
          </span>
        </div>
      </div>

      <div className="mt-3">
        {/* 업체 목록 */}
        {filtered.length > 0 ? (
          <div className="space-y-2.5">
            {filtered.map(store => (
              <StoreCard key={store.id} store={store} collegeFilter={college} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-3xl mb-3">🔍</span>
            <p className="text-[14px] font-extrabold text-text-sub">검색 결과가 없어요</p>
            <p className="text-[12px] text-text-hint mt-1">다른 키워드로 검색해 보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
