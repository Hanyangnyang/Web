import { ChevronRight, Smile } from 'lucide-react';
import { type Song, toReactionState, formatTimeAgo } from '../playlistTypes';
import { EMOJI_REACTIONS } from '../postReactions';

interface RecentSongRowProps {
  song: Song;
  onSelect: (song: Song) => void;
}

// 최근 추가된 곡 홈 미리보기 행 — 왼쪽은 앨범 커버, 오른쪽은 곡명·가수명 위에 한마디 코멘트 + 리액션 요약
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
      // 컨테이너 자체엔 패딩을 두지 않음 — 대신 오른쪽 텍스트 묶음에만 py-2.5를 줘서
      // 그 텍스트의 실제 높이가 곧 행 높이가 되게 하고, 왼쪽 앨범커버는 items-stretch(기본값)로
      // 그 높이에 맞춰 늘어나면서 왼쪽/위/아래 테두리에 여백 없이 꽉 차게 함(overflow-hidden으로 모서리만 둥글게 클립)
      className="flex gap-3 bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 active:bg-slate-100 active:scale-[0.98] transition-[background-color,transform] cursor-pointer overflow-hidden"
    >
      {/* 왼쪽: 앨범 커버 — 가로 비율을 2.5:7.5로 나눔(flex-[25]/flex-[75]), 왼쪽 끝에 붙이고 세로는 오른쪽 텍스트 묶음 높이에 맞춤 */}
      <div className="flex-[25] min-w-0 flex justify-start">
        <img
          src={song.albumArtUrl}
          alt={song.title}
          className="h-full aspect-square object-cover bg-slate-100"
        />
      </div>

      {/* 오른쪽: 곡명·가수명 + 한마디 코멘트 + 리액션 요약 */}
      <div className="flex-[75] min-w-0 flex flex-col gap-1 py-2.5">
        <div className="min-w-0 truncate">
          <span className="font-semibold text-text-main text-sm">{song.title}</span>
          <span className="text-xs text-text-sub"> · {song.artist}</span>
        </div>
        {song.comment && <p className="text-xs text-text-main truncate">{song.comment}</p>}
        <div className="flex items-center gap-1 min-w-0">
          {displayedReactions.length > 0 && (
            <div
              className="flex items-center gap-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayedReactions.map(({ key, emoji }) => (
                <span
                  key={key}
                  className="flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 border-transparent text-text-sub"
                >
                  <span className="text-[10px]">{emoji}</span>
                  <span>{reactions[key]?.count ?? 0}</span>
                </span>
              ))}
            </div>
          )}
          {displayedReactions.length === 0 && (
            <span className="flex items-center gap-1 min-w-0 pl-1 pr-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-text-sub">
              <Smile size={11} className="text-text-sub flex-shrink-0" strokeWidth={2} />
              <span className="truncate">반응하러 가자~!</span>
            </span>
          )}
          {/* 올린 시각 — 리액션이 있든 없든 오른쪽 끝에 고정 */}
          <span className="ml-auto flex-shrink-0 text-[10px] text-text-hint">
            {formatTimeAgo(song.createdAt)}
          </span>
        </div>
      </div>

      {/* 누르면 상세로 들어간다는 걸 알려주는 화살표 — 컨테이너 오른쪽 여백은 이 mr-3 하나로 대신함 */}
      <ChevronRight size={24} className="text-text-hint flex-shrink-0 self-center mr-2" />
    </div>
  );
}
