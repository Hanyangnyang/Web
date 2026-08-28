import { Play, Smile } from 'lucide-react';
import { useState } from 'react';
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

// 인스타그램 게시물처럼 앨범커버와 하단 콘텐츠가 하나의 카드로 이어지는 게시글 조회 카드. PostDetailView에서 사용
export function PostDetailCard({ post, className = '', onPlay, isPlaying = false }: PostDetailCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const genre = GENRES.find((g) => g.label === post.genre);

  const toggleReaction = (emoji: string) => {
    setMyReactions((prev) => {
      const next = new Set(prev);
      if (next.has(emoji)) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
  };

  // 다른 사용자 반응 수 + 내 반응 여부를 합쳐서 0보다 큰 이모지만 표시
  const displayedEmojis = EMOJI_OPTIONS.filter(
    (emoji) => (DUMMY_REACTION_COUNTS[emoji] ?? 0) + (myReactions.has(emoji) ? 1 : 0) > 0
  );

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden ${className}`}>
      {/* 앨범 커버 */}
      <div className="relative">
        <img
          src={post.albumArtUrl}
          alt={post.title}
          className="w-full aspect-square object-cover bg-slate-100"
        />

        {onPlay && !isPlaying && (
          <button
            onClick={onPlay}
            aria-label={`${post.title} 재생`}
            className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform"
          >
            {/* 버튼/아이콘을 카드 폭 대비 %로 지정해서 2열이든 1열이든 항상 같은 비율로 보이게 함 */}
            <span className="w-[16%] aspect-square rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <Play className="w-1/2 h-1/2 text-white" fill="white" stroke="white" strokeWidth={1} />
            </span>
          </button>
        )}
      </div>

      <div className="px-4 pt-3 pb-4">
        {/* 이모지 리액션 — 여러 개 선택 가능, 이모지 옆 숫자는 다른 사용자를 포함한 총 반응 수 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {/* 이모지 추가 버튼 */}
          <div className="relative inline-block">
            <button
              onClick={() => setPickerOpen((prev) => !prev)}
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
                      onClick={() => {
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
                onClick={() => toggleReaction(emoji)}
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

        {/* 제목 · 가수명 */}
        <div className="mb-2 truncate">
          <span className="text-base font-bold text-text-main">{post.title}</span>
          <span className="text-sm font-medium text-text-sub"> · {post.artist}</span>
        </div>

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
