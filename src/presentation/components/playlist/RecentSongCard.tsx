import { Heart, Play } from 'lucide-react';
import { useState } from 'react';
import { type Song } from './playlistTypes';

interface RecentSongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  onRequireLogin: () => void;
}

export function RecentSongCard({ song, onPlay, onRequireLogin }: RecentSongCardProps) {
  const [heartClicked, setHeartClicked] = useState(false);
  const [displayHeartCount, setDisplayHeartCount] = useState(song.heartCount);

  return (
    <div className="flex-shrink-0 w-56 aspect-[4/5] bg-white rounded-lg overflow-hidden shadow-md flex flex-col relative">
      {/* 앨범커버 + 오버레이 */}
      <div className="relative flex-1">
        <img
          src={song.albumArtUrl}
          alt={song.title}
          className="w-full h-full object-cover"
        />

        {/* 중앙 재생 버튼 (하단 사용자 정보 바를 제외한 앨범커버 영역 기준 정중앙) */}
        <div className="absolute inset-x-0 top-0 bottom-[52px] flex items-center justify-center z-10">
          <button onClick={() => onPlay(song)} className="flex items-center justify-center text-black hover:scale-110 transition-transform active:scale-95">
            <Play size={40} fill="none" stroke="currentColor" strokeWidth={2} />
          </button>
        </div>

        {/* 우측 상단 하트 버튼 + 개수 */}
        <div className="absolute top-3 right-3 flex flex-col items-center gap-0.5 z-10">
          <button
            onClick={onRequireLogin}
            className="flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <Heart
              size={18}
              className="text-red-500 stroke-[2]"
              fill={heartClicked ? "currentColor" : "none"}
            />
          </button>
          <div className="text-[10px] font-extrabold text-white drop-shadow-lg">
            {displayHeartCount}
          </div>
        </div>

        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black pointer-events-none" />
        {/* 곡 정보 오버레이 */}
        <div className="absolute bottom-[52px] inset-x-0 px-3 py-3 text-white">
          <div className="text-sm font-bold truncate">{song.title}</div>
          <div className="text-sm opacity-90 truncate">{song.artist}</div>
        </div>
      </div>

      {/* 사용자 정보 섹션 */}
      <div className="absolute bottom-0 inset-x-0 px-3 py-3 bg-gradient-to-b from-black/50 to-black rounded-b-lg z-10">
        <div className="flex items-center gap-2">
          <img
            src={song.userProfile.avatarUrl}
            alt={song.userProfile.name}
            className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-white/30"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white leading-snug line-clamp-1">
              "{song.comment}"
            </div>
            <div className="text-[10px] text-white truncate ml-1 opacity-80 ">
              {song.userProfile.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
