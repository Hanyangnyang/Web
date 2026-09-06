// 컴포넌트: "오늘의 동아리 추천" 무지개 배너 — 중앙동아리 화면 상단, 소식탭 공용
import { useState, type KeyboardEvent, type MouseEventHandler, type ReactNode } from 'react';
import { type ClubInfo } from '../../../domain/entities/Club.js';
import { categoryStyles, getActivityEmoji } from './clubDisplay.js';

interface ClubSpotlightCardProps {
  club: ClubInfo;
  actionLabel: string;
  actionIcon?: ReactNode;
  iconPosition?: 'start' | 'end';
  onAction: () => void;
  // true면 박스 전체가 하나의 탭 영역이 됨 (소식탭처럼 카드 = 단순 이동 배너인 경우만 사용)
  fullCardClickable?: boolean;
  // 버튼(onAction)과 별개로, 카드의 나머지 영역을 눌렀을 때 다른 동작을 하고 싶을 때만 사용
  // (예: 중앙동아리 화면에서 버튼은 인스타그램 이동, 카드는 아래 목록의 해당 동아리로 스크롤)
  onCardClick?: () => void;
}

export function ClubSpotlightCard({ club, actionLabel, actionIcon, iconPosition = 'end', onAction, fullCardClickable = false, onCardClick }: ClubSpotlightCardProps) {
  const style = categoryStyles[club.category];
  const [imageFailed, setImageFailed] = useState(false);

  const cardClickHandler = fullCardClickable ? onAction : onCardClick;
  const isCardClickable = !!cardClickHandler;

  const handleCardKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cardClickHandler?.();
    }
  };

  const handleButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (onCardClick) e.stopPropagation(); // 카드와 버튼이 서로 다른 동작일 때만 버블링을 막는다
    onAction();
  };

  return (
    <article
      className={`club-spotlight-roll mb-2 rounded-2xl border border-[#E4405F]/5 bg-[linear-gradient(120deg,rgba(100,180,255,0.16),rgba(140,150,255,0.08),rgba(180,140,255,0.08))] px-3.5 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] ${isCardClickable ? 'cursor-pointer active:opacity-80 transition-opacity' : ''}`}
      role={isCardClickable ? 'button' : undefined}
      tabIndex={isCardClickable ? 0 : undefined}
      aria-label={isCardClickable ? (fullCardClickable ? `${club.name} 정보 보기` : `${club.name} 목록에서 보기`) : undefined}
      onClick={cardClickHandler}
      onKeyDown={isCardClickable ? handleCardKeyDown : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="h-[54px] w-[54px] flex-shrink-0 overflow-hidden rounded-card bg-white ring-1 ring-black/[0.04]">
          {!imageFailed ? (
            <img
              src={`/assets/club-profiles/${club.id}.jpg?v=20260906`}
              alt={`${club.name} 로고`}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center text-[24px] ${style.icon}`} aria-hidden="true">{getActivityEmoji(club.activityType)}</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold tracking-tight text-primary">🎲 오늘의 동아리 추천 </p>
          <p className="mt-0.5 truncate text-[13px] text-text-sub">
            <strong className="font-extrabold text-text-main">{club.activityType}</strong> 동아리, <strong className="font-extrabold text-text-main">{club.name}</strong> 어때요?
          </p>
        </div>

        {fullCardClickable ? (
          <span
            aria-hidden="true"
            className="ml-auto inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[#E4405F]/90 px-2.5 py-1.5 text-[11px] font-extrabold text-white"
          >
            {iconPosition === 'start' ? (
              <>
                {actionIcon}
                {actionLabel}
              </>
            ) : (
              <>
                {actionLabel}
                {actionIcon}
              </>
            )}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleButtonClick}
            className="ml-auto inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[#E4405F]/90 px-2.5 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-[#D62E50] active:bg-[#B92543]"
            aria-label={`${club.name} 정보 보기`}
          >
            {iconPosition === 'start' ? (
              <>
                {actionIcon}
                {actionLabel}
              </>
            ) : (
              <>
                {actionLabel}
                {actionIcon}
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
