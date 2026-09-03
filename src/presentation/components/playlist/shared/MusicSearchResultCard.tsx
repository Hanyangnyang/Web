import { ChevronRight, MessageCircle, Pause, PenLine, Play } from 'lucide-react';
import { type MusicSearchTrack } from '../../../../domain/entities/MusicSearchTrack.js';

interface MusicSearchResultCardProps {
  track: MusicSearchTrack;
  // 앨범커버 클릭 — 바로 재생/일시정지. 화면에 재생 기능이 없으면(예: onPlay 미전달) 앨범커버는 그냥 이미지로만 표시
  onPlay?: (track: MusicSearchTrack) => void;
  isPlaying?: boolean;
  // 하단 정보 영역 클릭 — 검색결과 화면(게시글 모음 이동)/곡추천하기 화면(곡 선택)마다 다른 동작을 그대로 위임
  onSelect: (track: MusicSearchTrack) => void;
  selectLabel: string;
  // true면 카드를 흐리게 하고 클릭을 막음 — 곡추천하기에서 최근 7일 내 이미 추천한 곡에 씀
  disabled?: boolean;
  // disabled일 때 "추천글 N개" 대신 보여줄 안내 문구(예: "최근 추천함")
  disabledMessage?: string;
  // 카드 안에 "곡 추천하기" 행을 세 번째 섹션으로 추가함(앨범커버/곡정보/곡추천하기) — 검색결과 화면에서
  // 이 곡이 미리 채워진 채로 곡추천하기 화면으로 바로 이동시키는 용도. 안 넘기면(예: 곡추천하기 화면 자체) 행이 아예 안 뜸
  onRecommend?: (track: MusicSearchTrack) => void;
  // 가수명/추천글 옆 화살표 표시 여부 — 곡추천하기 화면의 검색 결과에서는 "다음 화면으로 이동"이 아니라
  // "이 곡을 고른다"는 동작이라 화살표가 어울리지 않아서 false로 끔. 기본값은 true(검색결과 화면 등)
  showChevron?: boolean;
  className?: string;
}

// 카드 아래 분리된 곡 추천하기 버튼(구버전) 노출 여부 — 카드 안에 이어붙인 버전으로 바뀌면서 꺼둠.
// boolean으로 명시 타입을 줘야 아래 `onRecommend && ... &&` 체인에서 literal false로 인한 미도달 코드 취급을 피함
const SHOW_OLD_STANDALONE_RECOMMEND_BUTTON: boolean = false;

// Spotify 카탈로그 검색 결과 카드 — 검색결과 화면·곡추천하기 화면이 공유하는 스타일
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
  className = 'w-36',
}: MusicSearchResultCardProps) {
  return (
    <div
      className={`flex-shrink-0 ${className} rounded-xl border border-slate-200 bg-white overflow-hidden transition-opacity ${disabled ? 'opacity-40' : ''}`}
    >
      {/* 앨범커버 */}
      {onPlay ? (
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

      {/* 하단 정보 영역 — 눌렀을 때 동작은 onSelect로 화면마다 위임. 제목은 화살표와 무관하게 자기
          줄을 온전히 차지하고, 화살표는 그 아래 가수명+추천글 두 줄에만 세로 중앙 정렬되게
          그 둘을 별도 flex row로 묶음(제목까지 셋을 한 row로 묶으면 화살표가 제목 쪽까지 걸쳐 보였음) */}
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
              // 이 곡에 등록된 추천글 수 — 백엔드 카탈로그 검색 응답의 recommendationCount
              <div className="flex items-center gap-0.5 text-[10px] text-text-hint truncate">
                <MessageCircle size={10} className="flex-shrink-0" />
                <span>추천글 {track.recommendationCount}개</span>
              </div>
            )}
          </div>
          {/* 가수명/추천글 옆 빈 공간에 카드를 누르면 넘어간다는 걸 알려주는 화살표 */}
          {showChevron && <ChevronRight size={14} className="text-text-hint flex-shrink-0" strokeWidth={2.5} />}
        </div>
      </button>

      {/* 세 번째 행: 곡 추천하기 — 카드에서 떨어뜨리지 않고 앨범커버/곡정보와 같은 카드 안에 이어붙임.
          누르면 이 곡이 미리 채워진 채로 곡추천하기 화면으로 이동 */}
      {onRecommend && (
        <button
          onClick={() => onRecommend(track)}
          disabled={disabled}
          aria-label={`${track.title} 곡 추천하기`}
          className="w-full h-7 border-t border-slate-100 bg-[#ffffff] text-[#8B5CF6]/80 flex items-center justify-center gap-1 hover:bg-[#8B5CF6]/5 active:bg-[#8B5CF6]/5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <PenLine size={10} strokeWidth={2.2} className="flex-shrink-0" />
          <span className="text-[10px] font-bold">이 곡 추천하러 가기</span>
        </button>
      )}

      {/* 카드 밖으로 분리된 이전 버전(카드 아래 별도 버튼) — 삭제 대신 비활성화만 해둠.
          다시 쓰게 되면 아래 카드 div를 flex flex-col gap-1.5로 감싸는 wrapper를 복원해야 함 */}
      {onRecommend && SHOW_OLD_STANDALONE_RECOMMEND_BUTTON && (
        <button
          onClick={() => onRecommend(track)}
          disabled={disabled}
          aria-label={`${track.title} 곡 추천하기`}
          className="w-full h-6 rounded-full bg-[#8B5CF6]/20 text-black/80 flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-40 disabled:pointer-events-none"
        >
          <PenLine size={10} strokeWidth={2.2} className="flex-shrink-0" />
          <span className="text-[10px] font-bold">곡 추천하기</span>
        </button>
      )}
    </div>
  );
}
