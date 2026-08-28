import { Heart, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { type Song, GENRES } from './playlistTypes';

interface RecentSongCardProps {
  song: Song;
}

export function RecentSongCard({ song }: RecentSongCardProps) {
  const [heartClicked, setHeartClicked] = useState(false);
  const genre = GENRES.find((g) => g.label === song.genres[0]);

  return (
    <div className="flex-shrink-0 w-44 aspect-square rounded-xl overflow-hidden shadow-lg relative">
      {/* 앨범커버 전체 배경 */}
      <img
        src={song.albumArtUrl}
        alt={song.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 우측 상단 버튼 그룹: 하트, 더보기 */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setHeartClicked((prev) => !prev)}
          className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Heart
            size={16}
            className="text-red-500 stroke-[2]"
            fill={heartClicked ? 'currentColor' : 'none'}
          />
        </button>

        {/* 더보기 버튼: 동작은 추후 구현 */}
        <button
          aria-label="더보기"
          className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <MoreVertical size={16} className="text-white" />
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-3 text-white">
        <div className="mb-1 truncate">
          <span className="text-sm font-bold">{song.title}</span>
          <span className="text-[10px] font-medium opacity-90 ml-1">{song.artist}</span>
        </div>
        <div className="text-[10px] truncate">"{song.comment}"</div>

        <div className="border-t border-white/20 my-1" />

        <div className="flex items-center gap-1 text-[9px] font-medium opacity-90 ml-0.5">
          {genre?.emoji && <span>{genre.emoji}</span>}
          <span className="truncate">{song.genres[0]}</span>
        </div>
      </div>
    </div>
  );
}
