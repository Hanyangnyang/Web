import { Heart, Play } from 'lucide-react';
import { useState } from 'react';
import { type Song } from './playlistTypes';

interface ChartSongRowProps {
  song: Song;
  rank: number;
  onPlay: (song: Song) => void;
  onRequireLogin: () => void;
}

export function ChartSongRow({ song, rank, onPlay, onRequireLogin }: ChartSongRowProps) {
  const [heartClicked, setHeartClicked] = useState(false);
  const [displayHeartCount, setDisplayHeartCount] = useState(song.heartCount);

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-200 hover:bg-slate-50 transition-colors">
      {/* 순위 */}
      <span className="font-bold text-sm text-gray-900 w-7 text-center flex-shrink-0">
        {rank}
      </span>

      {/* 앨범 커버 */}
      {song.albumArtUrl && (
        <img
          src={song.albumArtUrl}
          alt={song.title}
          className="w-12 h-12 object-cover rounded flex-shrink-0"
        />
      )}

      {/* 곡정보 */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-text-main truncate text-sm">{song.title}</div>
        <div className="text-xs text-text-sub truncate">{song.artist}</div>
      </div>

      {/* 재생 버튼 */}
      <button
        onClick={() => onPlay(song)}
        className="w-6 flex items-center justify-center text-black hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
      >
        <Play size={18} fill="none" stroke="currentColor" strokeWidth={2} />
      </button>

      {/* 좋아요 */}
      <div className="w-8 mt-3 flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
        <button
          onClick={onRequireLogin}
          className="flex items-center justify-center w-6 text-red-500 hover:scale-110 transition-transform active:scale-95"
        >
          <Heart
            size={18}
            className="stroke-[2]"
            fill={heartClicked ? "currentColor" : "none"}
          />
        </button>
        <span className="text-[9px] font-semibold text-black">{displayHeartCount}</span>
      </div>
    </div>
  );
}
