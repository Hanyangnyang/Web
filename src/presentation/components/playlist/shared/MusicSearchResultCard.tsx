import { ChevronRight, MessageCircle, Pause, PenLine, Play } from 'lucide-react';
import { type MusicSearchTrack } from '../../../../domain/entities/MusicSearchTrack.js';

interface MusicSearchResultCardProps {
  track: MusicSearchTrack;
  onPlay?: (track: MusicSearchTrack) => void;
  isPlaying?: boolean;
  onSelect: (track: MusicSearchTrack) => void;
  selectLabel: string;
  disabled?: boolean; 
  disabledMessage?: string; 
  onRecommend?: (track: MusicSearchTrack) => void;
  showChevron?: boolean;
  albumArtSelects?: boolean;
  className?: string;
}

// Spotify 카탈로그 검색 결과 카드 
export function MusicSearchResultCard({
  track,
  onPlay,
  isPlaying = false,
  onSelect,
  selectLabel,
  disabled = false,
  disabledMessage,
  onRecommend,
  showChevron = true,
  albumArtSelects = false,
  className = 'w-36',
}: MusicSearchResultCardProps) {
  return (
    <div
      className={`flex-shrink-0 ${className} rounded-xl border border-slate-200 bg-white overflow-hidden transition-opacity ${disabled ? 'opacity-40' : ''}`}
    >
      {/* 앨범커버 */}
      {albumArtSelects ? (
        <div className="relative w-full aspect-square">
          <button
            onClick={() => onSelect(track)}
            disabled={disabled}
            aria-label={selectLabel}
            className="block w-full h-full active:scale-95 transition-transform disabled:pointer-events-none"
          >
            <img src={track.albumArtUrl} alt={track.title} className="w-full h-full object-cover bg-slate-100" />
          </button>
          {/* 표지 전체는 곡 선택 버튼이고, 가운데 원형 아이콘만 별도 버튼으로 재생/일시정지(선택으로 전파되지 않게 막음) */}
          {onPlay && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(track);
              }}
              aria-label={isPlaying ? `${track.title} 일시정지` : `${track.title} 재생`}
              className="absolute inset-0 m-auto w-[22%] aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
              ) : (
                <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
              )}
            </button>
          )}
        </div>
      ) : onPlay ? (
        <button
          onClick={() => onPlay(track)}
          disabled={disabled}
          aria-label={isPlaying ? `${track.title} 일시정지` : `${track.title} 재생`}
          className="relative block w-full aspect-square active:scale-95 transition-transform disabled:pointer-events-none"
        >
          <img src={track.albumArtUrl} alt={track.title} className="w-full h-full object-cover bg-slate-100" />
          {/* 재생/일시정지 아이콘 — 버튼이 이미 앨범커버 전체를 감싸고 있어 별도 버튼이 아니라 장식용 오버레이임 */}
          {!disabled && (
            <span className="absolute inset-0 m-auto w-[22%] aspect-square rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-md flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
              ) : (
                <Play className="w-1/2 h-1/2 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]" fill="white" stroke="white" strokeWidth={1} />
              )}
            </span>
          )}
        </button>
      ) : (
        <div className="w-full aspect-square">
          <img src={track.albumArtUrl} alt={track.title} className="w-full h-full object-cover bg-slate-100" />
        </div>
      )}

      {/* 하단 정보 영역 */}
      <button
        onClick={() => onSelect(track)}
        disabled={disabled}
        aria-label={selectLabel}
        className="w-full px-2 py-1.5 flex flex-col text-left hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:pointer-events-none"
      >
        <div className="text-sm font-semibold text-text-main truncate">{track.title}</div>
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-text-sub truncate">{track.artist}</div>
            {disabled && disabledMessage ? (
              <div className="text-[10px] font-semibold text-red-400 truncate">{disabledMessage}</div>
            ) : (
              // 이 곡에 등록된 게시글 수 — 백엔드 카탈로그 검색 응답의 recommendationCount
              <div className="flex items-center gap-0.5 text-[10px] text-text-hint truncate">
                <MessageCircle size={10} className="flex-shrink-0" />
                <span>게시글 {track.recommendationCount}개</span>
              </div>
            )}
          </div>
          {/* 가수명/게시글 옆 빈 공간에 카드를 누르면 넘어간다는 걸 알려주는 화살표 */}
          {showChevron && <ChevronRight size={14} className="text-text-hint flex-shrink-0" strokeWidth={2.5} />}
        </div>
      </button>

      {/* 세 번째 행: 곡 추천하기 */}
      {onRecommend && (
        <button
          onClick={() => onRecommend(track)}
          disabled={disabled}
          aria-label={`${track.title} 곡 추천하기`}
          className="w-full h-8 border-t border-slate-100 bg-[#ffffff] text-playlist-accent/80 flex items-center justify-center gap-1 hover:bg-playlist-accent/5 active:bg-playlist-accent/5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <PenLine size={10} strokeWidth={2.2} className="flex-shrink-0" />
          <span className="text-[10px] font-bold">이 곡 추천하러 가기</span>
        </button>
      )}
    </div>
  );
}
