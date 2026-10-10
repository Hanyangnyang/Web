import { ChevronRight, MessageCircle, Pause, PenLine, Play } from 'lucide-react';
import { type MusicSearchTrack } from '../../../../domain/entities/MusicSearchTrack.js';

interface MusicSearchResultCardProps {
  track: MusicSearchTrack;
  onPlay?: (track: MusicSearchTrack) => void;
  isPlaying?: boolean;
  // source: 앨범커버를 눌러 선택했는지('cover') 하단 정보 영역을 눌러 선택했는지('info') — 호출하는 쪽이 선택 시 재생 여부 등을 구분할 수 있게 알려줌
  onSelect: (track: MusicSearchTrack, source: 'cover' | 'info') => void;
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
            onClick={() => onSelect(track, 'cover')}
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
        onClick={() => onSelect(track, 'info')}
        disabled={disabled}
        aria-label={selectLabel}
        className="relative w-full px-2 py-1.5 flex flex-col text-left hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:pointer-events-none"
      >
        {/* 곡명(leading-5=20px)·가수명(leading-4=16px) 줄 높이를 고정해서, 화살표를 둘 사이 경계선(위 여백 6px + 20px = 26px)에 세로 중앙으로 맞춤 */}
        <div className={`text-sm leading-5 font-semibold text-text-main truncate ${showChevron ? 'pr-5' : ''}`}>{track.title}</div>
        <div className="min-w-0">
          <div className={`text-xs leading-4 text-text-sub truncate ${showChevron ? 'pr-5' : ''}`}>{track.artist}</div>
          {disabled && disabledMessage ? (
            <div className="text-[10px] font-semibold text-red-400 truncate">{disabledMessage}</div>
          ) : !onRecommend && (
            // 이 곡에 등록된 추천글 수 — 백엔드 카탈로그 검색 응답의 recommendationCount.
            // "이 곡 추천하러 가기" 버튼이 있는 검색 결과 화면에서는 그 버튼 위 별도 줄에 회색 문구로 보여줌(아래 참고)
            <div className="flex items-center gap-0.5 text-[10px] text-playlist-primary truncate">
              <MessageCircle size={10} className="flex-shrink-0" />
              <span>추천글 {track.recommendationCount}개</span>
            </div>
          )}
        </div>
        {/* 카드를 누르면 넘어간다는 걸 알려주는 화살표 — 곡명과 가수명 사이 경계선에 세로 중앙 정렬 */}
        {showChevron && <ChevronRight size={14} className="absolute right-2 top-[19px] text-text-hint" strokeWidth={2.5} />}
      </button>

      {/* 곡 추천하기 섹션 — 추천글 수 안내와 "이 곡 추천하러 가기"를 하나의 버튼으로 묶어서 함께 눌림/호버되게 함 */}
      {onRecommend && (
        <button
          onClick={() => onRecommend(track)}
          disabled={disabled}
          aria-label={`${track.title} 곡 추천하기`}
          className="w-full px-2 py-1.5 border-t border-slate-100 bg-[#ffffff] flex flex-col items-center gap-0 hover:bg-playlist-accent/5 active:bg-playlist-accent/5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <span className="flex items-center gap-1 leading-4 text-playlist-accent/80">
            <PenLine size={10} strokeWidth={2.2} className="flex-shrink-0" />
            <span className="text-[10px] leading-4 font-bold">이 곡 추천하러 가기</span>
          </span>
          <span className="max-w-full text-[10px] leading-4 text-text-hint truncate">추천글이 {track.recommendationCount}개 밖에 없어요</span>
        </button>
      )}
    </div>
  );
}
