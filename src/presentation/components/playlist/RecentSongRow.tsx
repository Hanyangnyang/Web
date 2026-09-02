import { ChevronRight } from 'lucide-react';
import { type Song, toReactionState, formatTimeAgo } from './playlistTypes';
import { EMOJI_REACTIONS } from './postReactions';

interface RecentSongRowProps {
  song: Song;
  onSelect: (song: Song) => void;
}

// 최근 추가된 곡 홈 미리보기 행 — 왼쪽은 곡정보, 가운데 세로 구분선 오른쪽은 한마디 코멘트 + 리액션 요약
export function RecentSongRow({ song, onSelect }: RecentSongRowProps) {
  const reactions = toReactionState(song.reactions);
  const displayedReactions = EMOJI_REACTIONS.filter(({ key }) => (reactions[key]?.count ?? 0) > 0);

  return (
    <div
      onClick={() => onSelect(song)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(song);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${song.title} 전체보기`}
      className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98] transition-[background-color,transform] cursor-pointer"
    >
      {/* 왼쪽: 앨범 커버 + 곡정보 */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <img
          src={song.albumArtUrl}
          alt={song.title}
          className="w-12 h-12 object-cover rounded flex-shrink-0 bg-slate-100"
        />
        <div className="min-w-0">
          <div className="font-semibold text-text-main truncate text-sm">{song.title}</div>
          <div className="text-xs text-text-sub truncate">{song.artist}</div>
        </div>
      </div>

      {/* 가운데 세로 구분선 */}
      <div className="self-stretch w-px bg-slate-200 flex-shrink-0" />

      {/* 오른쪽: 한마디 코멘트 + 리액션 요약 */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {song.comment && <p className="text-xs text-text-main truncate">{song.comment}</p>}
        <div className="flex items-center gap-1 min-w-0">
          {displayedReactions.length > 0 && (
            <div
              className="flex items-center gap-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayedReactions.map(({ key, emoji }) => {
                const mine = reactions[key]?.mine ?? false;
                return (
                  <span
                    key={key}
                    className="flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 border-transparent text-text-sub"
                  >
                    {/* 내가 남긴 반응이 아니면 흑백(2D) 톤으로 살짝 죽여서 구분 */}
                    <span className={`text-[10px] ${mine ? '' : 'grayscale opacity-70'}`}>{emoji}</span>
                    <span>{reactions[key]?.count ?? 0}</span>
                  </span>
                );
              })}
            </div>
          )}
          {/* 올린 시각 — 리액션이 있든 없든 오른쪽 끝에 고정 */}
          <span className="ml-auto flex-shrink-0 text-[10px] text-text-hint">
            {formatTimeAgo(song.createdAt)}
          </span>
        </div>
      </div>

      {/* 누르면 상세로 들어간다는 걸 알려주는 화살표 */}
      <ChevronRight size={16} className="text-text-hint flex-shrink-0" />
    </div>
  );
}
