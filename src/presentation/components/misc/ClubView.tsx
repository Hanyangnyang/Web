// 컴포넌트: 중앙동아리 목록 — 활동 성격·인스타그램·회비를 빠르게 확인
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { CLUB_CATEGORIES, CLUBS, type ClubCategory, type ClubInfo } from '../../../domain/entities/Club.js';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { useClubSpotlight } from '../../hooks/useClubSpotlight.js';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { MiscSubViewHeader } from './MiscSubViewHeader.js';
import { ClubSpotlightCard } from './ClubSpotlightCard.js';
import { ClubFeedbackModal } from './ClubFeedbackModal.js';
import { categoryStyles, categoryEmoji, getActivityEmoji } from './clubDisplay.js';

type CategoryFilter = '전체' | ClubCategory;

const InstagramIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
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

function ClubBadge({ club }: { club: ClubInfo }) {
  const style = categoryStyles[club.category];
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`relative w-[52px] h-[52px] rounded-card flex items-center justify-center flex-shrink-0 overflow-hidden ring-1 ring-black/[0.04] ${style.icon}`}>
      {!imageFailed && !imageLoaded && <div className="absolute inset-0 img-shimmer" aria-hidden="true" />}
      {!imageFailed && (
        <img
          src={`/assets/club-profiles/${club.id}.jpg?v=20260906`}
          alt={`${club.name} 프로필`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {imageFailed && <span className="text-[23px] leading-none" aria-hidden="true">{getActivityEmoji(club.activityType)}</span>}
    </div>
  );
}

function ClubItem({ club, highlighted }: { club: ClubInfo; highlighted?: boolean }) {
  return (
    <article
      id={`club-item-${club.id}`}
      className={`bg-white border border-slate-200/90 rounded-2xl px-3.5 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.035)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_6px_16px_rgba(15,23,42,0.06)] ${highlighted ? 'club-item-highlight' : ''}`}
    >
      <div className="flex items-center gap-3">
        <ClubBadge club={club} />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <h3 className="flex-shrink-0 font-extrabold text-[14px] leading-5 text-text-main truncate">{club.name}</h3>
            <p className="min-w-0 flex-1 text-[12px] leading-5 text-text-sub truncate">
              <span className="font-bold text-text-sub">{club.activityType}</span>
            </p>
            {club.instagram && (
              <button
                type="button"
                className="flex-shrink-0 inline-flex items-center gap-1 min-w-0 max-w-[38%] rounded-full bg-[#E4405F]/[0.1] px-2 py-1 text-[10px] font-bold text-[#C13557] shadow-[0_1px_1px_rgba(228,64,95,0.1)] transition-colors hover:bg-[#E4405F]/[0.16] active:bg-[#E4405F]/[0.2]"
                onClick={() => openInsta(club.instagram!)}
                aria-label={`${club.name} 인스타그램 열기`}
              >
                <InstagramIcon size={11} />
                <span className="truncate">@{club.instagram}</span>
              </button>
            )}
          </div>

          <p className="mt-1 truncate text-[12px] leading-5 text-text-sub">&quot;{club.description}&quot;</p>
        </div>
      </div>
    </article>
  );
}

interface ClubViewProps {
  onBack: () => void;
  // 소식탭 오늘의 동아리 추천에서 "보러가기"로 넘어왔을 때, 그 동아리 위치로 한 번만 자동 스크롤
  scrollToClubId?: string | null;
  onScrollToClubIdHandled?: () => void;
}

export function ClubView({ onBack, scrollToClubId, onScrollToClubIdHandled }: ClubViewProps) {
  useBackHandler(onBack);
  const isApp = isNativeApp();
  const platform = getPlatform();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('전체');
  const [query, setQuery] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [highlightedClubId, setHighlightedClubId] = useState<string | null>(null);
  const spotlightClub = useClubSpotlight();
  const filteredClubs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    return CLUBS
      .filter((club) => {
        if (activeCategory !== '전체' && club.category !== activeCategory) return false;
        if (!normalizedQuery) return true;
        return [club.name, club.activityType, club.room, club.instagram, ...club.aliases]
          .filter(Boolean)
          .some(value => value!.toLocaleLowerCase('ko-KR').includes(normalizedQuery));
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
  }, [query, activeCategory]);

  // 특정 동아리 위치로 자동 스크롤 + 도착한 카드를 잠깐 반짝여서 눈에 띄게 함
  // (목록이 실제로 그려진 뒤여야 하므로 rAF를 두 번 거친다)
  const scrollAndHighlightClub = useCallback((clubId: string, onDone?: () => void) => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document.getElementById(`club-item-${clubId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedClubId(clubId);
        window.setTimeout(() => setHighlightedClubId(null), 1800);
        onDone?.();
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, []);

  // 딥링크(소식탭 "보러가기")로 넘어온 경우 — "소비 완료" 알림은 스크롤이 실제로 끝난 뒤(rAF 콜백 안)에
  // 보내야 한다. 예약과 동시에 보내면 부모의 scrollToClubId가 곧바로 null로 내려와 이 effect가 재실행되고,
  // cleanup이 아직 발화 전인 rAF를 취소해버려 스크롤이 통째로 무산되는 경우가 있었다(주로 콜드스타트 첫 진입).
  useEffect(() => {
    if (!scrollToClubId) return;
    const cancel = scrollAndHighlightClub(scrollToClubId, onScrollToClubIdHandled);
    return cancel;
  }, [scrollToClubId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 상단 "오늘의 동아리 추천" 카드를 눌렀을 때: 필터/검색을 초기화해 목록에서 반드시 보이게 한 뒤 스크롤
  const handleSpotlightCardClick = () => {
    setActiveCategory('전체');
    setQuery('');
    scrollAndHighlightClub(spotlightClub.id);
  };

  // 스크롤 컨테이너의 top padding과 정확히 같은 값이어야, 아래 sticky 헤더가 그만큼 위로
  // 파고들어(top/margin-top을 이 값의 음수로) 세이프에리어(노치)까지 완전히 덮을 수 있다.
  // 이 값이 컨테이너 padding-top과 어긋나면 스크롤 시 노치 부분에 헤더 배경이 못 미쳐
  // 뒤 콘텐츠가 잠깐 비쳐 보인다 (중앙동아리 화면에서만 나던 현상의 원인).
  const scrollTopPadding = isApp
    ? `calc(1.5rem + ${platform === 'ios' ? 'env(safe-area-inset-top)' : 'env(safe-area-inset-top, 28px)'})`
    : '1.5rem';

  return (
    <div className="fixed inset-0 z-[1001] bg-surface">
      <div
        className="mx-auto h-full w-full max-w-app overflow-y-auto overflow-x-hidden px-4 pb-4"
        style={{
          paddingTop: scrollTopPadding,
          ...(isApp ? { paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' } : {}),
        }}
      >
        <div
          className="sticky z-20 -mx-4 bg-surface/90 backdrop-blur-xl px-4 pb-2 rounded-b-xl border-b border-[#e2e8f0]/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          style={{ top: `calc(-1 * (${scrollTopPadding}))`, marginTop: `calc(-1 * (${scrollTopPadding}))`, paddingTop: scrollTopPadding }}
        >
          <div className="-mb-4 pb-2">
            <MiscSubViewHeader
              title="중앙동아리"
              onBack={onBack}
              rightAction={(
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  aria-label="중앙동아리 정보 제보하기"
                  className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-2 text-[12px] font-bold text-text-main transition-colors hover:bg-surface active:bg-surface"
                >
                  <span className="text-[13px] leading-none" aria-hidden="true">📢</span>
                  제보하기
                </button>
              )}
            />
          </div>
          <div className="flex items-center gap-2.5 mb-2 bg-white border border-[#e2e8f0] rounded-card px-3.5 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] transition-all focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)]">
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

          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
            {(['전체', ...CLUB_CATEGORIES] as CategoryFilter[]).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-[7px] rounded-xl text-[12px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] [-webkit-tap-highlight-color:transparent] ${activeCategory === category ? 'bg-primary text-white border-primary shadow-[0_2px_6px_rgba(14,74,132,0.25)]' : 'bg-white text-[#334155] border-[#cbd5e1]'}`}
              >
                {category !== '전체' && <span className="text-[12px] leading-none">{categoryEmoji[category]}</span>}
                {category}
              </button>
            ))}
          </div>
          <p className="px-1 text-[12px] font-bold text-text-hint">
            동아리 {filteredClubs.length}개
            {activeCategory !== '전체' && <span className="text-primary"> · {activeCategory}</span>}
            {query && <span className="text-primary"> · &quot;{query}&quot;</span>}
          </p>
        </div>

        <div className="pt-2 [animation:slideUp_0.4s_ease-out]">
          <ClubSpotlightCard
            key={spotlightClub.id}
            club={spotlightClub}
            actionLabel="바로가기"
            actionIcon={<InstagramIcon />}
            iconPosition="start"
            onAction={() => openInsta(spotlightClub.instagram!)}
            onCardClick={handleSpotlightCardClick}
          />
          {filteredClubs.length > 0 ? (
            <div className="space-y-2">
              {filteredClubs.map(club => (
                <ClubItem key={club.id} club={club} highlighted={club.id === highlightedClubId} />
              ))}
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
      {feedbackOpen && <ClubFeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
