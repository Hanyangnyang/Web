import { Heart, Play, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type Song, GENRES } from './playlistTypes';

export interface PostDetailCardData {
  albumArtUrl: string;
  title: string;
  artist: string;
  body: string;
  genre: string;
}

interface PostDetailCardProps {
  post: PostDetailCardData;
  className?: string;
  // 넘겨줄 때만 앨범커버 중앙에 재생 버튼이 뜸
  onPlay?: () => void;
  // 지금 이 곡이 하단 플레이어에서 재생 중인지 — true면 재생 버튼을 숨김
  isPlaying?: boolean;
  // true면 이모지 리액션을 숨김 — 빠르게 훑어보는 요약 목록(2열)용
  hideReactions?: boolean;
  // 넘겨주면 카드 전체가 클릭 가능해짐 — 요약 목록(2열)에서 눌러 상세(1열)로 전환할 때 사용
  onSelect?: () => void;
}

// 리스트/캐러셀에서 쓰는 Song 엔티티를 PostDetailCard가 받는 형태로 변환 (본문=comment, 장르=genres[0])
export function songToPostDetailCardData(song: Song): PostDetailCardData {
  return {
    albumArtUrl: song.albumArtUrl,
    title: song.title,
    artist: song.artist,
    body: song.comment,
    genre: song.genres[0] ?? '',
  };
}

const EMOJI_OPTIONS = ['😍', '😂', '😮', '😢', '👍', '🔥', '💯', '🥹'];

// UI 디자인용 임시 더미 — 다른 사용자들이 이미 남긴 이모지별 반응 수
const DUMMY_REACTION_COUNTS: Record<string, number> = {
  '😍': 3,
  '👍': 5,
  '🔥': 1,
};

const HEART_POP_DURATION_MS = 800;

// 인스타그램 게시물처럼 앨범커버와 하단 콘텐츠가 하나의 카드로 이어지는 게시글 조회 카드. PostDetailView에서 사용
export function PostDetailCard({
  post,
  className = '',
  onPlay,
  isPlaying = false,
  hideReactions = false,
  onSelect,
}: PostDetailCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const [liked, setLiked] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const heartPopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genre = GENRES.find((g) => g.label === post.genre);

  useEffect(() => {
    return () => {
      if (heartPopTimerRef.current) clearTimeout(heartPopTimerRef.current);
    };
  }, []);

  const toggleReaction = (emoji: string) => {
    setMyReactions((prev) => {
      const next = new Set(prev);
      if (next.has(emoji)) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
  };

  const toggleLiked = () => setLiked((prev) => !prev);

  // 인스타그램 더블탭 좋아요처럼: 이미 좋아요 상태여도 항상 좋아요로 고정하고, 하트 팝 애니메이션을 다시 보여줌
  const handleDoubleTapLike = () => {
    setLiked(true);
    setShowHeartPop(true);
    if (heartPopTimerRef.current) clearTimeout(heartPopTimerRef.current);
    heartPopTimerRef.current = setTimeout(() => setShowHeartPop(false), HEART_POP_DURATION_MS);
  };

  // 다른 사용자 반응 수 + 내 반응 여부를 합쳐서 0보다 큰 이모지만 표시
  const displayedEmojis = EMOJI_OPTIONS.filter(
    (emoji) => (DUMMY_REACTION_COUNTS[emoji] ?? 0) + (myReactions.has(emoji) ? 1 : 0) > 0
  );

  const titleBlock = (
    <div className="truncate">
      <span className="text-base font-bold text-text-main">{post.title}</span>
      <span className="text-sm font-medium text-text-sub"> · {post.artist}</span>
    </div>
  );

  return (
    <div
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect();
            }
          : undefined
      }
      aria-label={onSelect ? `${post.title} 상세 보기` : undefined}
      className={`bg-white rounded-2xl border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden ${onSelect ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 앨범 커버 — 상세(1열)에서는 더블클릭하면 인스타그램처럼 좋아요 하트가 튀어오름 */}
      <div className="relative" onDoubleClick={!hideReactions ? handleDoubleTapLike : undefined}>
        <img
          src={post.albumArtUrl}
          alt={post.title}
          className="w-full aspect-square object-cover bg-slate-100"
        />

        {onPlay && !isPlaying && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            aria-label={`${post.title} 재생`}
            className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform"
          >
            {/* 버튼/아이콘을 카드 폭 대비 %로 지정해서 2열이든 1열이든 항상 같은 비율로 보이게 함 */}
            <span className="w-[16%] aspect-square rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Play className="w-1/2 h-1/2 text-white" fill="white" stroke="white" strokeWidth={1} />
            </span>
          </button>
        )}

        {/* 요약 목록(2열): 앨범커버 우측 하단에 좋아요 배지 */}
        {hideReactions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLiked();
            }}
            aria-label="좋아요"
            className="absolute bottom-2 right-2 z-10 w-7 h-7 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <Heart size={14} className={liked ? 'text-red-500' : 'text-white'} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
          </button>
        )}

        {/* 더블탭 좋아요 하트 팝 애니메이션 */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className="w-1/4 h-1/4 text-white drop-shadow-lg"
              fill="white"
              style={{ animation: `heartPop ${HEART_POP_DURATION_MS}ms ease-out forwards` }}
            />
          </div>
        )}
      </div>

      <div className="px-4 pt-3 pb-4">
        {!hideReactions ? (
          <div className="flex items-start gap-2 mb-2">
            <div className="min-w-0 flex-1">
              {/* 이모지 리액션 — 여러 개 선택 가능, 이모지 옆 숫자는 다른 사용자를 포함한 총 반응 수 */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {/* 이모지 추가 버튼 */}
                <div className="relative inline-block">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickerOpen((prev) => !prev);
                    }}
                    aria-label="이모지 추가"
                    className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Smile size={13} className="text-text-sub" strokeWidth={2} />
                  </button>

                  {pickerOpen && (
                    <div className="absolute bottom-full left-0 mb-2 z-10">
                      <div className="flex gap-1 px-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReaction(emoji);
                              setPickerOpen(false);
                            }}
                            aria-label={`${emoji} 남기기`}
                            className="w-6 h-6 flex items-center justify-center text-xs rounded-full hover:bg-slate-100 active:scale-90 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      {/* 말풍선 꼬리 */}
                      <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45 ml-3 -mt-1.5" />
                    </div>
                  )}
                </div>

                {displayedEmojis.map((emoji) => {
                  const count = (DUMMY_REACTION_COUNTS[emoji] ?? 0) + (myReactions.has(emoji) ? 1 : 0);
                  const mine = myReactions.has(emoji);
                  return (
                    <button
                      key={emoji}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReaction(emoji);
                      }}
                      aria-label={`${emoji} 반응 ${mine ? '취소' : '남기기'}`}
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all active:scale-95 ${
                        mine ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-100 border-transparent text-text-sub'
                      }`}
                    >
                      <span className="text-xs">{emoji}</span>
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>

              {titleBlock}
            </div>

            {/* 좋아요 — 이모지 리액션 줄과 제목/가수명 줄 높이를 합친 만큼 오른쪽에 배치 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLiked();
              }}
              aria-label="좋아요"
              className="flex-shrink-0 self-center active:scale-90 transition-transform"
            >
              <Heart size={20} className={liked ? 'text-red-500' : 'text-text-sub'} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="mb-2">{titleBlock}</div>
        )}

        {/* 본문 */}
        <p className="text-sm text-text-main leading-relaxed mb-3 whitespace-pre-line">{post.body}</p>

        {/* 장르 */}
        <div className="flex items-center gap-1 text-xs font-medium text-text-sub">
          {genre?.emoji && <span>{genre.emoji}</span>}
          <span>{post.genre}</span>
        </div>
      </div>
    </div>
  );
}
