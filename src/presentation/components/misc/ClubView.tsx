// 컴포넌트: 중앙동아리 목록 — 활동 성격·동아리방·인스타그램·회비를 빠르게 확인
import { useEffect, useMemo, useState } from 'react';
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`w-[52px] h-[52px] rounded-card flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-black/[0.04] ${style.icon}`}>
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
    <article className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.035)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <ClubBadge club={club} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-[14px] leading-5 text-text-main truncate">{club.name}</h3>
            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${style.badge}`}>{club.category}</span>
          </div>

          <p className="mt-0.5 text-[12px] leading-5 text-text-sub truncate">
            <span className="font-bold text-slate-600">{club.activityType}</span>
            {club.room && <span className="text-text-hint"> · {club.room}</span>}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
            {club.instagram ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 min-w-0 rounded-full bg-[#E4405F]/[0.07] px-2.5 py-1.5 text-[11px] font-bold text-[#C13557] transition-colors hover:bg-[#E4405F]/[0.12] active:bg-[#E4405F]/[0.17]"
                onClick={() => openInsta(club.instagram!)}
                aria-label={`${club.name} 인스타그램 열기`}
              >
                <InstagramIcon />
                <span className="truncate">@{club.instagram}</span>
              </button>
            ) : (
              <span className="text-[11px] font-medium text-text-hint">인스타 정보 없음</span>
            )}
            <span className="flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-extrabold text-slate-600">
              회비 {getPrimaryFee(club)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ClubSpotlight({ club }: { club: ClubInfo }) {
  const style = categoryStyles[club.category];
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="club-spotlight-roll mb-4 flex items-center gap-3 py-2">
      <div className="h-[62px] w-[62px] flex-shrink-0 overflow-hidden rounded-card bg-white ring-1 ring-black/[0.04]">
        {!imageFailed ? (
          <img
            src={`/assets/club-profiles/${club.id}.jpg`}
            alt={`${club.name} 로고`}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center text-[28px] ${style.icon}`} aria-hidden="true">{getActivityEmoji(club.activityType)}</div>
        )}
      </div>
      <p className="min-w-0 flex-1 whitespace-nowrap text-[13px] text-text-sub">
        <strong className="font-extrabold text-text-main">{club.activityType}</strong> 동아리 <strong className="font-extrabold text-text-main">{club.name}</strong> 어때요?
      </p>
      <button
        type="button"
        onClick={() => openInsta(club.instagram!)}
        className="ml-auto inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[#E4405F] px-3 py-2 text-[11px] font-extrabold text-white transition-colors hover:bg-[#D62E50] active:bg-[#B92543]"
        aria-label={`${club.name} 인스타그램 열기`}
      >
        <InstagramIcon />
        인스타 바로가기
      </button>
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
  const [spotlightClub, setSpotlightClub] = useState<ClubInfo>(() => {
    const clubsWithInstagram = CLUBS.filter((club) => club.instagram);
    return clubsWithInstagram[Math.floor(Math.random() * clubsWithInstagram.length)];
  });
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSpotlightClub((currentClub) => {
        const candidates = CLUBS.filter((club) => club.instagram && club.id !== currentClub.id);
        return candidates[Math.floor(Math.random() * candidates.length)];
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);
  const filteredClubs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    return CLUBS.filter((club) => {
      if (activeCategory !== '전체' && club.category !== activeCategory) return false;
      if (!normalizedQuery) return true;
      return [club.name, club.activityType, club.room, club.instagram, ...club.aliases]
        .filter(Boolean)
        .some(value => value!.toLocaleLowerCase('ko-KR').includes(normalizedQuery));
    });
  }, [query, activeCategory]);

  return (
    <div className="pb-20">
      <div className="sticky -top-6 z-20 -mx-4 -mt-6 border-b border-slate-200/80 bg-[#F8F9FA] px-4 pt-6 pb-3 shadow-[0_8px_14px_-14px_rgba(15,23,42,0.32)]">
        <MiscSubViewHeader title="중앙동아리" onBack={onBack} />
        <div className="flex items-center gap-2.5 mb-3 bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition-all focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/[0.08]">
          <Search size={16} className="text-text-hint flex-shrink-0" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="동아리명이나 활동으로 검색"
            className="flex-1 min-w-0 bg-transparent text-[13px] font-semibold text-text-main outline-none placeholder:text-text-hint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="검색어 지우기"
              className="flex-shrink-0 active:scale-90 transition-transform"
            >
              <X size={15} className="text-text-hint" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 no-scrollbar">
          {(['전체', ...CLUB_CATEGORIES] as CategoryFilter[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={`flex-shrink-0 px-3 py-[7px] rounded-full text-[12px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] shadow-[0_2px_6px_rgba(0,0,0,0.08)] [-webkit-tap-highlight-color:transparent] ${activeCategory === category ? 'bg-primary text-white border-primary' : 'bg-white text-text-sub border-slate-200 hover:border-primary hover:text-primary'}`}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="px-1 text-[12px] font-bold text-text-hint">{filteredClubs.length}개</p>
      </div>

      <div className="pt-3 [animation:slideUp_0.4s_ease-out]">
        <ClubSpotlight key={spotlightClub.id} club={spotlightClub} />
        {filteredClubs.length > 0 ? (
          <div className="space-y-2.5">
            {filteredClubs.map(club => <ClubItem key={club.id} club={club} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
            <Search size={24} className="mx-auto mb-2 text-slate-300" />
            <p className="text-[14px] font-bold text-text-sub">검색 결과가 없어요</p>
            <p className="mt-1 text-[12px] text-text-hint">동아리명이나 활동 종류를 다시 검색해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
