import { type TrackSummary } from '../playlistTypes';

type MySongCardTrack = TrackSummary & { comment?: string };

interface MySongCardProps {
  track: MySongCardTrack;
  // 카드 어디를 눌러도 호출 — 홈에서는 "내가 추천한 곡" 화면으로 이동해 이 곡으로 스크롤
  onSelect: () => void;
}

// 홈 "내가 추천한 곡" 미리보기 카드 — ChartTopCard와 같은 비주얼(앨범아트 전체 배경 + 하단에 곡명·가수명·수평선·사용자 한마디).
// 재생/게시글 모음 분기 없이 카드 전체가 하나의 버튼
export function MySongCard({ track, onSelect }: MySongCardProps) {
  return (
    <button
      onClick={onSelect}
      aria-label={`${track.title} - ${track.artist}, 내가 추천한 곡 보기`}
      className="relative w-[152px] flex-shrink-0 aspect-[3/4] rounded-xl overflow-hidden shadow-lg text-left active:scale-[0.98] transition-transform"
    >
      <img src={track.albumArtUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col px-3 pb-3">
        <div className="text-sm font-bold text-white truncate leading-tight">{track.title}</div>
        <div className="text-xs font-medium text-white/90 truncate leading-tight mt-1">{track.artist}</div>
        <div className="h-px bg-white/40 my-2" aria-hidden="true" />
        {/* 사용자 한마디 — 한 줄로 말줄임 */}
        {track.comment && (
          <div className="text-xs font-medium text-white/90 truncate leading-tight">"{track.comment}"</div>
        )}
      </div>
    </button>
  );
}
