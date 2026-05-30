// 컴포넌트: 단과대 제휴 업체 검색 및 혜택 조회
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react';
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
  { id: '3',   name: '공과대학' },
  { id: '4',   name: '약학대학' },
  { id: '5',   name: '디자인대학' },
  { id: '6',   name: '글로벌문화통상대학' },
  { id: '7',   name: '경상대학' },
  { id: '8',   name: '소프트웨어융합대학' },
  { id: '9',   name: '예체능대학' },
  { id: '10',  name: '첨단융합대학' },
  { id: '11',  name: '총학생회' },
];

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
        {/* 카테고리 이모지 */}
        <span className="text-xl flex-shrink-0">{CATEGORY_EMOJI[store.category] || '🏪'}</span>

        {/* 업체명 + 혜택 요약 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-extrabold text-text-main truncate">{store.name}</span>
            {!store.is_active && (
              <span className="text-[9px] font-bold px-1 py-px rounded bg-red-50 text-red-400 border border-red-100">폐업</span>
            )}
          </div>
          <span className="text-[11px] text-text-sub font-semibold mt-px block truncate">{store.summary_benefit}</span>
        </div>

        {/* 단과대 카운트 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {uniqueColleges.length === 1 ? (
            <span className="text-[10px] font-bold text-text-hint bg-surface px-1.5 py-0.5 rounded-full">{uniqueColleges[0].college_name}</span>
          ) : (
            <span className="text-[10px] font-bold text-text-hint bg-surface px-1.5 py-0.5 rounded-full">{uniqueColleges.length}개 단과대</span>
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
                className="bg-surface rounded-xl p-3"
              >
                {/* 단과대 + 기간 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold text-primary">🎓 {p.college_name}</span>
                  <span className="text-[9px] text-text-hint font-medium">
                    {p.period?.start_date?.slice(5)} ~ {p.period?.end_date?.slice(5)}
                  </span>
                </div>

                {/* 혜택 */}
                <p className="text-[12px] text-text-main font-semibold leading-[1.65] whitespace-pre-line">{p.benefit}</p>

                {/* 조건 */}
                {p.conditions && (
                  <div className="flex items-start gap-1 mt-2">
                    <Info size={10} className="text-text-hint mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-text-hint leading-[1.5] font-medium">{p.conditions}</p>
                  </div>
                )}

                {/* 출처 */}
                {p.source_url && (
                  <a
                    href={p.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-semibold text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={9} />
                    출처 확인
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PartnershipView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [college, setCollege] = useState(() => localStorage.getItem('partnerCollegeFilter') || 'all');
  const inputRef = useRef(null);

  const handleCollegeChange = useCallback((id) => {
    setCollege(id);
    localStorage.setItem('partnerCollegeFilter', id);
  }, []);

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
      const q = query.trim().toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.summary_benefit?.toLowerCase().includes(q) ||
        s.partnerships.some(p =>
          p.college_name?.toLowerCase().includes(q) ||
          p.benefit?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [query, category, college]);

  const clearSearch = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const selectedCollegeName = COLLEGES.find(c => c.id === college)?.name;

  return (
    <div className="pb-20 [animation:slideUp_0.4s_ease-out]">
      {/* 헤더 */}
      <h2 className="text-2xl font-extrabold text-text-main mb-1">제휴 혜택</h2>
      <p className="text-[13px] text-text-sub font-medium mb-5">학생증 제시 시 받을 수 있는 혜택을 검색하세요</p>

      {/* 검색 바 */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2.5 bg-white border border-[#e2e8f0] rounded-card px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
          <Search size={16} className="text-text-hint flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="업체명, 혜택, 단과대로 검색"
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
      <div className="mb-2">
        <span className="text-[11px] font-bold text-text-hint mb-1.5 block">🎓 내 단과대</span>
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {COLLEGES.map(c => (
            <button
              key={c.id}
              onClick={() => handleCollegeChange(c.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
                college === c.id
                  ? 'bg-[#0E4A84] text-white border-[#0E4A84]'
                  : 'bg-white text-text-sub border-[#e2e8f0]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
              category === cat.key
                ? 'bg-primary text-white border-primary shadow-[0_2px_6px_rgba(14,74,132,0.25)]'
                : 'bg-white text-text-sub border-[#e2e8f0]'
            }`}
          >
            <span className="text-[13px]">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* 결과 카운트 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-text-hint font-semibold">
          {filtered.length}개 업체
          {college !== 'all' && <span className="text-primary"> · {selectedCollegeName}</span>}
          {query && <span className="text-primary"> · "{query}"</span>}
        </span>
      </div>

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
  );
}
