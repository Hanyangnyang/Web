import { ChevronRight, Pause, Play, Smile } from 'lucide-react';
import { type Song, toReactionState, formatTimeAgo } from '../playlistTypes';
import { EMOJI_REACTIONS } from '../postReactions';

interface RecentSongRowProps {
  song: Song;
  // 앨범커버 이외의 나머지 영역(곡 정보 + 화살표) 클릭 — 최근 추가된 곡 전체보기로 이동해서 이 곡으로 스크롤
  onSelect: (song: Song) => void;
  // 앨범커버 클릭 — 바로 재생
  onPlay: (song: Song) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 앨범커버의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
}

// 최근 추가된 곡 홈 미리보기 행 — 앨범커버만 누르면 바로 재생되고, 그 외 나머지 영역(곡 정보 + 화살표)을
// 누르면 최근 추가된 곡 전체보기로 이동해서 이 카드 위치로 스크롤됨
export function RecentSongRow({ song, onSelect, onPlay, currentTrackId }: RecentSongRowProps) {
  const reactions = toReactionState(song.reactions);
  const displayedReactions = EMOJI_REACTIONS.filter(({ key }) => (reactions[key]?.count ?? 0) > 0);
  const isPlaying = song.trackId === currentTrackId;

  return (
    <div className="flex items-stretch min-h-[64px] bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* 앨범 커버 — 가로 비율을 2.5:7.5로 나눔(flex-[25]/flex-[75]), 눌러서 바로 재생 */}
      <button
        onClick={() => onPlay(song)}
        aria-label={isPlaying ? `${song.title} 일시정지` : `${song.title} 재생`}
        className="relative flex-[25] min-w-0 flex justify-start active:opacity-80 transition-opacity"
      >
        <img
          src={song.albumArtUrl}
          alt={song.title}
          className="h-full aspect-square object-cover bg-slate-100"
        />
        {/* 재생/일시정지 아이콘 — 재생 중엔 일시정지 아이콘으로 바뀌고, 눌러서 그대로 멈출 수 있음 */}
        <span className="absolute inset-0 m-auto w-[34%] aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center">
          {isPlaying ? (
            <Pause className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
          ) : (
            <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
          )}
        </span>
      </button>

      {/* 나머지 전체(곡 정보 + 화살표) — 눌러서 최근 추가된 곡 전체보기로 이동, 이 카드 위치로 스크롤 */}
      <button
        onClick={() => onSelect(song)}
        aria-label={`${song.title} 전체보기`}
        className="flex flex-[75] min-w-0 items-center gap-1 pl-2.5 pr-2 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
      >
        {/* 곡명·가수명 + 한마디 코멘트 + 리액션 요약  */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
          <div className="min-w-0 truncate leading-tight">
            <span className="font-semibold text-text-main text-sm">{song.title}</span>
            <span className="text-xs text-text-sub"> · {song.artist}</span>
          </div>
          {/* 한마디 코멘트 */}
          {song.comment && (
            <p className="text-xs text-text-main truncate leading-tight">
              <span className="mr-[1px]">"</span>
              {song.comment}
              <span className="ml-[1px]">"</span>
            </p>
          )}
          {/* 이모지와 올린시각  */}
          <div className="flex items-center gap-1 min-w-0 leading-tight">
            {displayedReactions.length > 0 && (
              <div
                className="flex items-center gap-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {displayedReactions.map(({ key, emoji }) => (
                  <span
                    key={key}
                    className="flex-shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 border-transparent text-text-sub"
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
                <span className="truncate">반응 남기기</span>
              </span>
            )}
            <span className="ml-auto flex-shrink-0 text-[10px] text-text-hint">
              {formatTimeAgo(song.createdAt)}
            </span>
          </div>
        </div>

        <ChevronRight size={24} className="text-text-hint flex-shrink-0" />
      </button>
    </div>
  );
}
