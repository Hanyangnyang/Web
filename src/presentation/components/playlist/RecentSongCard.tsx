import { Heart, Play } from 'lucide-react';
import { useState } from 'react';
import { type Song, GENRES } from './playlistTypes';

interface RecentSongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  onRequireLogin: () => void;
}

export function RecentSongCard({ song, onPlay, onRequireLogin }: RecentSongCardProps) {
  const [heartClicked, setHeartClicked] = useState(false);
  const genre = GENRES.find((g) => g.label === song.genres[0]);

  return (
    <div className="flex-shrink-0 w-44 aspect-[4/5] rounded-xl overflow-hidden shadow-lg relative">
      {/* 앨범커버 전체 배경 */}
      <img
        src={song.albumArtUrl}
        alt={song.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 가독성용 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

      {/* 우측 상단 하트 버튼 */}
      <button
        onClick={onRequireLogin}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-md active:scale-95 transition-transform"
      >
        <Heart
          size={16}
          className="text-red-500 stroke-[2]"
          fill={heartClicked ? 'currentColor' : 'none'}
        />
      </button>

      {/* 중앙 재생 버튼: 카드 정중앙 */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <button
          onClick={() => onPlay(song)}
          className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center text-white -translate-y-3 active:scale-95 transition-transform"
        >
          <Play size={32} fill="white" stroke="white" strokeWidth={1} className="drop-shadow-lg" />
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-3 text-white">
        <div className="mb-1 truncate">
          <span className="text-sm font-bold">{song.title}</span>
          <span className="text-[10px] font-medium opacity-90 ml-1">{song.artist}</span>
        </div>
        <div className="text-[10px] truncate">"{song.comment}"</div>
        <div className="text-[9px] opacity-70 truncate ml-0.5">{song.userProfile.name}</div>

        <div className="border-t border-white/20 my-1" />

        <div className="flex items-center gap-1 text-[9px] font-medium opacity-90 ml-0.5">
          {genre?.emoji && <span>{genre.emoji}</span>}
          <span className="truncate">{song.genres[0]}</span>
        </div>
      </div>
    </div>
  );
}
