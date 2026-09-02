import type { ReactNode } from 'react';
import { Smile } from 'lucide-react';
import { EMOJI_REACTIONS, type ReactionKey } from './postReactions';
import { type ReactionState } from './playlistTypes';

interface EmojiReactionBarProps {
  reactions: ReactionState;
  onToggleReaction: (key: ReactionKey) => void;
  disabled?: boolean;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  // 'default': PostDetailCard(1열 상세) 크기, 'compact': TrackPostCollectionView 같은 목록 행 크기
  size?: 'default' | 'compact';
  // 반응이 하나도 없을 때 보여줄 안내 — 안 넘기면 이모지 추가 버튼만 남고 아무것도 안 보여줌
  emptyFallback?: ReactNode;
  className?: string;
}

// 이모지 추가 버튼(팝오버) + 이미 달린 리액션 칩 — PostDetailCard/TrackPostCollectionView가 공유하는
// "게시글에 이모지로 반응하기" UI. 팝오버 열림 상태와 반응 토글은 부모가 들고 있고, 이 컴포넌트는
// 순수 표시 + 이벤트 위임만 함(부모마다 단건/목록별 반응 상태 관리 방식이 달라서)
export function EmojiReactionBar({
  reactions,
  onToggleReaction,
  disabled = false,
  pickerOpen,
  onTogglePicker,
  size = 'default',
  emptyFallback,
  className = '',
}: EmojiReactionBarProps) {
  const displayedReactions = EMOJI_REACTIONS.filter(({ key }) => (reactions[key]?.count ?? 0) > 0);
  const isCompact = size === 'compact';
  const addButtonSizeClass = isCompact ? 'w-5 h-5' : 'w-6 h-6';
  const addButtonIconSize = isCompact ? 11 : 13;
  const chipGapClass = isCompact ? 'gap-1' : 'gap-1.5';

  return (
    <div className={`flex items-center ${chipGapClass} ${className}`}>
      {/* 이모지 추가 버튼 — 스크롤 영역 밖에 고정, 위로 뜨는 팝오버가 잘리지 않게 함 */}
      <div className="relative inline-block flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePicker();
          }}
          aria-label="이모지 추가"
          className={`${addButtonSizeClass} rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform`}
        >
          <Smile size={addButtonIconSize} className="text-text-sub" strokeWidth={2} />
        </button>

        {pickerOpen && (
          <div className="absolute bottom-full left-0 mb-2 z-10">
            <div className="flex gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
              {EMOJI_REACTIONS.map(({ key, emoji }) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction(key);
                    onTogglePicker();
                  }}
                  disabled={disabled}
                  aria-label={`${emoji} 남기기`}
                  className="w-8 h-8 flex items-center justify-center text-base rounded-full hover:bg-slate-100 active:scale-90 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* 말풍선 꼬리 */}
            <div className="w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45 ml-3 -mt-1.5" />
          </div>
        )}
      </div>

      {displayedReactions.length > 0 ? (
        /* 이미 달린 리액션 칩 — 9종까지 늘어날 수 있어서 가로 스크롤 */
        <div
          className={`flex items-center ${chipGapClass} flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedReactions.map(({ key, emoji }) => {
            const { count, mine } = reactions[key] ?? { count: 0, mine: false };
            return (
              <button
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(key);
                }}
                disabled={disabled}
                aria-label={`${emoji} 반응 ${mine ? '취소' : '남기기'}`}
                className={`flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all active:scale-95 ${
                  mine ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-100 border-transparent text-text-sub'
                }`}
              >
                <span className="text-xs">{emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      ) : (
        emptyFallback
      )}
    </div>
  );
}
