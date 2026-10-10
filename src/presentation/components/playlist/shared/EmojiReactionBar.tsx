import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Smile } from 'lucide-react';
import { EMOJI_REACTIONS, type ReactionKey } from '../postReactions';
import { type ReactionState } from '../playlistTypes';

interface EmojiReactionBarProps {
  reactions: ReactionState;
  onToggleReaction: (key: ReactionKey) => void;
  disabled?: boolean;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  // 'default': PostDetailCard(1열 상세) 크기, 'compact': TrackPostCollectionView 같은 목록 행 크기, 'mini': 2열 그리드 카드용(가장 작음)
  size?: 'default' | 'compact' | 'mini';
  // 반응이 하나도 없을 때 보여줄 안내 — 안 넘기면 이모지 추가 버튼만 남고 아무것도 안 보여줌
  emptyFallback?: ReactNode;
  className?: string;
  // 2열 카드처럼 폭이 좁은 곳용 — 이모지 선택창이 1열과 같은 크기(가로 한 줄 알약)로 떠서 카드보다 넓을 수 있으므로,
  // 이모지 버튼이 아니라 가장 가까운 relative 조상(PostDetailCard 하단 영역=카드 폭)의 가장자리에 붙여 띄움.
  // 'left'면 카드 왼쪽 끝에서 오른쪽으로, 'right'면 카드 오른쪽 끝에서 왼쪽으로 펼쳐서 화면 밖으로 안 나가게 함(오른쪽 열 카드용)
  pickerAnchor?: 'left' | 'right';
}

// 이모지 추가 버튼(팝오버) + 이미 달린 리액션 칩 — PostDetailCard/TrackPostCollectionView가 공유하는
// "게시글에 이모지로 반응하기" UI. 팝오버 열림 상태와 반응 토글은 부모가 들고 있고, 이 컴포넌트는
// 순수 표시 + 이벤트 위임만 함(부모마다 단건/목록별 반응 상태 관리 방식이 달라서)
// 스마일 버튼을 이 시간 이상 누르고 있으면 "꾹 누르기" — 선택창이 열리고, 손가락을 그대로 좌우로 밀면 그 위치의 이모지가 활성화된다
const HOLD_MS = 250;

export function EmojiReactionBar({
  reactions,
  onToggleReaction,
  disabled = false,
  pickerOpen,
  onTogglePicker,
  size = 'default',
  emptyFallback,
  className = '',
  pickerAnchor,
}: EmojiReactionBarProps) {
  const displayedReactions = EMOJI_REACTIONS.filter(({ key }) => (reactions[key]?.count ?? 0) > 0);
  const pickerWrapperRef = useRef<HTMLDivElement>(null);
  const onTogglePickerRef = useRef(onTogglePicker);
  onTogglePickerRef.current = onTogglePicker;

  // 꾹 누르고 슬라이드해서 고르기: 누른 채로 열린 선택창에서 손가락 x 위치에 해당하는 이모지를 hoverKey로 표시하고,
  // 손을 떼는 순간 그 이모지로 반응을 남긴다(이모지 위가 아니면 선택창만 열린 채로 둠)
  const pickerRowRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdingRef = useRef(false); // 꾹 누르기로 선택창이 열려 슬라이드 중인지
  const longPressedRef = useRef(false); // 꾹 누르기 뒤에 따라오는 click이 선택창을 다시 닫지 않게 막는 표시
  const hoverKeyRef = useRef<ReactionKey | null>(null);
  const [hoverKey, setHoverKey] = useState<ReactionKey | null>(null);
  const updateHoverKey = (key: ReactionKey | null) => {
    hoverKeyRef.current = key;
    setHoverKey(key);
  };
  const clearHoldTimer = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  };
  useEffect(() => clearHoldTimer, []);

  // 손가락의 가로 위치와 가장 가까운 이모지 — 선택창은 버튼 위에 떠 있어서 세로 위치는 보지 않고, 선택창 가로 범위 밖이면 없음
  const findKeyAtX = (clientX: number): ReactionKey | null => {
    const buttons = pickerRowRef.current?.querySelectorAll<HTMLElement>('[data-reaction-key]');
    if (!buttons || buttons.length === 0) return null;
    const first = buttons[0].getBoundingClientRect();
    const last = buttons[buttons.length - 1].getBoundingClientRect();
    if (clientX < first.left || clientX > last.right) return null;
    let nearest: { key: string; distance: number } | null = null;
    buttons.forEach((button) => {
      const rect = button.getBoundingClientRect();
      const distance = Math.abs(clientX - (rect.left + rect.width / 2));
      if (!nearest || distance < nearest.distance) nearest = { key: button.dataset.reactionKey ?? '', distance };
    });
    return (nearest as { key: string } | null)?.key as ReactionKey | null;
  };

  const handleAddPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    longPressedRef.current = false;
    // 이미 열려 있으면 기존대로 click으로 닫기만 함
    if (pickerOpen) return;
    e.currentTarget.setPointerCapture(e.pointerId); // 손가락이 버튼 밖으로 나가도 move/up을 계속 받음
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      holdingRef.current = true;
      longPressedRef.current = true;
      onTogglePickerRef.current();
    }, HOLD_MS);
  };
  const handleAddPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (holdingRef.current) updateHoverKey(findKeyAtX(e.clientX));
  };
  const handleAddPointerUp = () => {
    clearHoldTimer();
    if (!holdingRef.current) return;
    holdingRef.current = false;
    const key = hoverKeyRef.current;
    updateHoverKey(null);
    if (key && !disabled) {
      onToggleReaction(key);
      onTogglePickerRef.current(); // 고른 뒤 선택창 닫기(탭해서 고를 때와 동일)
    }
  };
  const handleAddPointerCancel = () => {
    clearHoldTimer();
    holdingRef.current = false;
    updateHoverKey(null);
  };

  // 선택창이 열려 있을 때 버튼·선택창 바깥을 누르면 닫음. pointerdown 캡처 단계에서 받아 다른 요소가 전파를 막아도 동작하고,
  // 다른 카드의 이모지 버튼을 누르는 경우에도 click 전에 먼저 닫혀서 그 카드의 선택창이 정상적으로 열림
  useEffect(() => {
    if (!pickerOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (pickerWrapperRef.current?.contains(e.target as Node)) return;
      onTogglePickerRef.current();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [pickerOpen]);

  const isCompact = size === 'compact';
  const isMini = size === 'mini';
  const addButtonSizeClass = isMini ? 'w-[18px] h-[18px]' : isCompact ? 'w-5 h-5' : 'w-6 h-6';
  const addButtonIconSize = isMini ? 10 : isCompact ? 11 : 13;
  const chipGapClass = isCompact || isMini ? 'gap-1' : 'gap-1.5';
  const chipClass = isMini ? 'px-1 py-px text-[9px]' : 'px-1.5 py-0.5 text-[10px]';
  const chipEmojiClass = isMini ? 'text-[10px]' : 'text-xs';

  return (
    <div className={`flex items-center ${chipGapClass} ${className}`}>
      {/* 이모지 추가 버튼 — 스크롤 영역 밖에 고정, 위로 뜨는 팝오버가 잘리지 않게 함 */}
      {/* pickerAnchor가 있으면 relative를 빼서, 선택창이 이 버튼(폭 24px)이 아니라 가장 가까운 relative 조상(카드 폭 전체)을 기준으로 뜨게 함 */}
      <div ref={pickerWrapperRef} className={`${pickerAnchor ? '' : 'relative'} inline-block flex-shrink-0`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // 꾹 누르기로 이미 열었으면 이어서 오는 click은 무시(안 그러면 열자마자 닫힘)
            if (longPressedRef.current) {
              longPressedRef.current = false;
              return;
            }
            onTogglePicker();
          }}
          onPointerDown={handleAddPointerDown}
          onPointerMove={handleAddPointerMove}
          onPointerUp={handleAddPointerUp}
          onPointerCancel={handleAddPointerCancel}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="이모지 추가"
          style={{ touchAction: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
          className={`${addButtonSizeClass} rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform select-none`}
        >
          <Smile size={addButtonIconSize} className="text-text-sub" strokeWidth={2} />
        </button>

        {pickerOpen && (
          <div
            className={`absolute bottom-full mb-2 z-10 ${
              pickerAnchor ? `w-max ${pickerAnchor === 'right' ? 'right-0' : 'left-0'}` : 'left-0'
            }`}
          >
            <div ref={pickerRowRef} className="flex gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
              {EMOJI_REACTIONS.map(({ key, emoji }) => (
                <button
                  key={key}
                  data-reaction-key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction(key);
                    onTogglePicker();
                  }}
                  disabled={disabled}
                  aria-label={`${emoji} 남기기`}
                  className={`w-8 h-8 flex items-center justify-center text-base rounded-full hover:bg-slate-100 active:scale-90 transition-transform ${
                    hoverKey === key ? 'bg-slate-100 scale-125' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* 말풍선 꼬리 */}
            {!pickerAnchor && <div className="w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45 ml-[14px] -mt-1.5" />}
          </div>
        )}
        {/* 카드 가장자리 기준으로 띄운 선택창은 알약이 어느 쪽으로 펼쳐지든 꼬리가 이모지 추가 버튼(카드 왼쪽 padding 16px 뒤) 바로 위에 오도록 따로 둠 */}
        {pickerOpen && pickerAnchor && (
          <div className={`absolute bottom-full mb-[2px] ${isMini ? 'left-[19px]' : 'left-[22px]'} z-10 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45`} />
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
                className={`flex-shrink-0 flex items-center gap-0.5 ${chipClass} rounded-full font-semibold border transition-all active:scale-95 ${
                  mine ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-100 border-transparent text-text-sub'
                }`}
              >
                <span className={chipEmojiClass}>{emoji}</span>
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
