import { Heart, Play } from 'lucide-react';
import { useState } from 'react';
import { type Song, GENRES } from './playlistTypes';

interface SongPostCardProps {
  post: Song;
  // 카드 크기/배치(캐러셀의 고정폭+스냅 vs 그리드의 w-full)는 쓰는 쪽에서 주입
  className?: string;
  // 넘겨줄 때만 카드 중앙에 재생 버튼이 뜸 (캐러셀에선 재생이 필요 없어 생략 가능)
  onPlay?: (song: Song) => void;
}

// 게시글 카드 하나 = 이 곡을 추천한 게시글 한 개. SongPostsModal 캐러셀과
// 최근추가된곡/좋아요한곡 2열 그리드(SongListScreen)에서 동일한 디자인으로 재사용됨
export function SongPostCard({ post, className = '', onPlay }: SongPostCardProps) {
  const [heartClicked, setHeartClicked] = useState(false);
  const genre = GENRES.find((g) => g.label === post.genres[0]);

  return (
    <div className={`aspect-[3/4] rounded-2xl overflow-hidden shadow-xl relative bg-slate-900 ${className}`}>
      <img
        src={post.albumArtUrl}
        alt={post.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10 pointer-events-none" />

      <button
        onClick={() => setHeartClicked((prev) => !prev)}
        aria-label="이 게시글 좋아요"
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center active:scale-90 transition-transform"
      >
        <Heart
          size={16}
          className="text-red-400 stroke-[2]"
          fill={heartClicked ? 'currentColor' : 'none'}
        />
      </button>

      {onPlay && (
        <button
          onClick={() => onPlay(post)}
          aria-label={`${post.title} 재생`}
          className="absolute top-[30%] left-1/2 -translate-x-1/2 z-10 w-14 h-14 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <Play size={28} fill="white" stroke="white" strokeWidth={1} className="drop-shadow-lg" />
        </button>
      )}

      <div className="absolute bottom-0 inset-x-0 z-10 p-3.5 text-white">
        <div className="text-[10px] font-medium opacity-80 truncate mb-1.5">{post.title} · {post.artist}</div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <img
            src={post.userProfile.avatarUrl}
            alt="작성자 프로필"
            className="w-4 h-4 rounded-full border border-white/40 flex-shrink-0"
          />
        </div>

        <p className="text-xs font-medium leading-snug line-clamp-3">"{post.comment}"</p>

        <div className="border-t border-white/20 my-1.5" />

        <div className="flex items-center gap-1 text-[10px] font-medium opacity-90">
          {genre?.emoji && <span>{genre.emoji}</span>}
          <span className="truncate">{post.genres[0]}</span>
        </div>
      </div>
    </div>
  );
}
