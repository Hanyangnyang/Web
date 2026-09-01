// 컴포넌트: 중앙동아리 목록 — 활동 성격·동아리방·인스타그램·회비를 빠르게 확인
import { useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { CLUB_CATEGORIES, CLUBS, type ClubCategory, type ClubInfo } from '../../../domain/entities/Club.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { MiscSubViewHeader } from './MiscSubViewHeader.js';

type CategoryFilter = '전체' | ClubCategory;

const categoryStyles: Record<ClubCategory, { icon: string; badge: string }> = {
  예술: { icon: 'bg-violet-50 text-violet-600', badge: 'bg-violet-50 text-violet-600' },
  체육: { icon: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  학술교양: { icon: 'bg-blue-50 text-blue-600', badge: 'bg-blue-50 text-blue-700' },
  봉사: { icon: 'bg-rose-50 text-rose-600', badge: 'bg-rose-50 text-rose-600' },
  종교: { icon: 'bg-amber-50 text-amber-600', badge: 'bg-amber-50 text-amber-700' },
};

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </svg>
);

const openInsta = (username: string) => {
  const start = Date.now();
  window.location.href = `instagram://user?username=${username}`;
  setTimeout(() => {
    if (Date.now() - start < 2000) window.open(`https://www.instagram.com/${username}/`, '_blank');
  }, 500);
};

const getPrimaryFee = (club: ClubInfo) => {
  if (club.fees.length === 0) return club.feeNote ?? '미정';
  const primary = club.fees.find(entry => entry.label?.includes('신규') || entry.label?.includes('신입')) ?? club.fees[0];
  return primary.amount;
};

const getActivityEmoji = (activityType: string) => {
  const emojiByActivity: Array<[string, string]> = [
    ['밴드', '🎸'], ['농구', '🏀'], ['영화', '🎬'], ['공모전', '🏆'], ['칵테일', '🍸'],
    ['만화', '🎨'], ['뮤지컬', '🎭'], ['e스포츠', '🎮'], ['힙합', '🕺'], ['기독교', '✝️'],
    ['국악', '🥁'], ['볼링', '🎳'], ['댄스', '💃'], ['연극', '🎭'], ['축구', '⚽'],
    ['야구', '⚾'], ['유학', '🌏'], ['러닝', '🏃'], ['코딩', '💻'], ['봉사', '🤝'],
    ['천문', '🔭'], ['창작극', '🎭'], ['피아노', '🎹'], ['배드민턴', '🏸'], ['합창', '🎶'],
    ['토론', '💬'], ['클라이밍', '🧗'], ['자전거', '🚲'], ['스쿠버', '🤿'], ['기타', '🎼'],
    ['보드', '🎲'], ['독서', '📚'], ['테니스', '🎾'], ['탁구', '🏓'], ['흑인음악', '🎤'],
    ['요트', '⛵'], ['사진', '📷'], ['패션', '👗'], ['성경', '📖'],
  ];
  return emojiByActivity.find(([keyword]) => activityType.includes(keyword))?.[1] ?? '✨';
};

function ClubBadge({ club }: { club: ClubInfo }) {
  const style = categoryStyles[club.category];
  const [imageFailed, setImageFailed] = useState(!club.instagram);

  return (
    <div className={`w-[52px] h-[52px] rounded-[17px] flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-black/[0.04] ${style.icon}`}>
      {!imageFailed && (
        <img
          src={`/assets/club-profiles/${club.id}.jpg`}
          alt={`${club.name} 프로필`}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
      {imageFailed && <span className="text-[23px] leading-none" aria-hidden="true">{getActivityEmoji(club.activityType)}</span>}
    </div>
  );
}

function ClubItem({ club }: { club: ClubInfo }) {
  const style = categoryStyles[club.category];
  return (
    <article className="bg-white border border-slate-200/90 rounded-[18px] px-3.5 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.035)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <ClubBadge club={club} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-[17px] leading-6 text-text-main truncate">{club.name}</h3>
            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${style.badge}`}>{club.category}</span>
          </div>

          <p className="mt-0.5 text-[15px] leading-6 text-text-sub truncate">
            <span className="font-bold text-slate-600">{club.activityType}</span>
            {club.room && <span className="text-text-hint"> · {club.room}</span>}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
            {club.instagram ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 min-w-0 rounded-lg bg-[#E4405F]/[0.07] px-2.5 py-1.5 text-[12px] font-bold text-[#C13557] transition-colors hover:bg-[#E4405F]/[0.12] active:bg-[#E4405F]/[0.17]"
                onClick={() => openInsta(club.instagram!)}
                aria-label={`${club.name} 인스타그램 열기`}
              >
                <InstagramIcon />
                <span className="truncate">@{club.instagram}</span>
              </button>
            ) : (
              <span className="text-[12px] font-medium text-text-hint">인스타 정보 없음</span>
            )}
            <span className="flex-shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12px] font-extrabold text-slate-600">
              회비 {getPrimaryFee(club)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

interface ClubViewProps {
  onBack: () => void;
}

export function ClubView({ onBack }: ClubViewProps) {
  useBackHandler(onBack);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('전체');
  const [query, setQuery] = useState('');
  const sectionRefs = useRef<Partial<Record<ClubCategory, HTMLElement | null>>>({});
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const groupedClubs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    const matchedClubs = CLUBS.filter((club) => {
      if (!normalizedQuery) return true;
      return [club.name, club.activityType, club.room, club.instagram, ...club.aliases]
        .filter(Boolean)
        .some(value => value!.toLocaleLowerCase('ko-KR').includes(normalizedQuery));
    });

    return CLUB_CATEGORIES
      .map(category => ({ category, clubs: matchedClubs.filter(club => club.category === category) }))
      .filter(group => group.clubs.length > 0);
  }, [query]);

  const totalCount = groupedClubs.reduce((count, group) => count + group.clubs.length, 0);

  const moveToCategory = (category: CategoryFilter) => {
    setActiveCategory(category);
    const target = category === '전체' ? listTopRef.current : sectionRefs.current[category];
    const scrollContainer = target?.closest<HTMLElement>('[data-scroll-container]');
    if (!target || !scrollContainer) return;

    const stickyHeight = stickyHeaderRef.current?.offsetHeight ?? 0;
    const offset = target.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
    scrollContainer.scrollTo({
      top: Math.max(0, scrollContainer.scrollTop + offset - stickyHeight - 16),
      behavior: 'smooth',
    });
  };

  return (
    <div className="pb-20">
      <div ref={stickyHeaderRef} className="sticky -top-6 z-20 -mx-4 -mt-6 border-b border-slate-200/80 bg-[#F8F9FA] px-4 pt-6 pb-3 shadow-[0_8px_14px_-14px_rgba(15,23,42,0.32)]">
        <MiscSubViewHeader title="중앙동아리" onBack={onBack} />
        <div className="relative mb-3">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="동아리명이나 활동으로 검색"
            className="w-full h-12 rounded-[15px] border border-slate-200 bg-white pl-10 pr-10 text-[15px] font-medium text-text-main outline-none shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition-all placeholder:text-text-hint focus:border-primary/60 focus:ring-4 focus:ring-primary/[0.08]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 text-text-hint flex items-center justify-center hover:bg-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
          {(['전체', ...CLUB_CATEGORIES] as CategoryFilter[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => moveToCategory(category)}
              className={`flex-shrink-0 rounded-full px-3.5 py-2 text-[15px] font-bold transition-colors ${activeCategory === category ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-text-sub hover:bg-slate-50'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div ref={listTopRef} className="pt-3 [animation:slideUp_0.4s_ease-out]">
        {totalCount > 0 ? (
          <div className="space-y-7">
            {groupedClubs.map(({ category, clubs }) => (
              <section
                key={category}
                ref={(element) => { sectionRefs.current[category] = element; }}
              >
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <h3 className="text-[17px] font-extrabold text-text-main">{category}</h3>
                  <span className="text-[13px] font-bold text-text-hint">{clubs.length}개</span>
                </div>
                <div className="space-y-2.5">
                  {clubs.map(club => <ClubItem key={club.id} club={club} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
            <Search size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-[14px] font-bold text-text-sub">검색 결과가 없어요</p>
            <p className="mt-1 text-[12px] text-text-hint">동아리명이나 활동 종류를 다시 검색해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
