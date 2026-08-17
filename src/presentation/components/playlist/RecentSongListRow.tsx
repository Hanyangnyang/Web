import { Heart, Play } from 'lucide-react';
import { useState } from 'react';
import { type Song } from './playlistTypes';

interface RecentSongListRowProps {
  song: Song;
  onPlay: (song: Song) => void;
  onRequireLogin: () => void;
}

export function RecentSongListRow({ song, onPlay, onRequireLogin }: RecentSongListRowProps) {
  const [heartClicked, setHeartClicked] = useState(false);
  const [displayHeartCount, setDisplayHeartCount] = useState(song.heartCount);

  return (
    <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 transition-colors">
      {/* 왼쪽 60%: 곡 정보 (앨범커버 + 곡명/가수명 + 듣기 + 좋아요) */}
      <div className="flex-[6] min-w-0 flex items-center gap-2">
        <img
          src={song.albumArtUrl}
          alt={song.title}
          className="w-12 h-12 object-cover rounded flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-main truncate">{song.title}</div>
          <div className="text-xs text-text-sub truncate">{song.artist}</div>
        </div>

        {/* 재생 버튼 */}
        <button
          onClick={() => onPlay(song)}
          className="w-6 flex items-center justify-center text-black hover:scale-110 transition-transform active:scale-95 flex-shrink-0"
        >
          <Play size={18} fill="none" stroke="currentColor" strokeWidth={2} />
        </button>

        {/* 하트 아이콘 + 하트수 */}
        <div className="w-8 flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
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

      {/* 구분선 */}
      <div className="w-px self-stretch bg-slate-200 flex-shrink-0" />

      {/* 오른쪽 40%: 사용자 정보 (한마디 + 사용자명) */}
      <div className="flex-[4] min-w-0">
        <div className="text-[12px] font-semibold text-text-main line-clamp-2 leading-snug">"{song.comment}"</div>
        <div className="text-[10px] text-text-sub truncate pl-0.5 mt-0.5">{song.userProfile.name}</div>
      </div>
    </div>
  );
}
