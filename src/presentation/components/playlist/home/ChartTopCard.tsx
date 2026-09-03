import { ChevronRight, Play } from 'lucide-react';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';
import { type TrackSummary } from '../playlistTypes';

interface ChartTopCardProps {
  track: ChartTrack;
  // 이 곡에 달린 추천 게시글 목록(캐러셀)을 보여달라는 요청 — 북마크가 "곡"이 아니라 "게시글"에 귀속돼서
  // 여러 게시글이 있을 수 있는 곡 하나에 바로 붙일 수 없어 상세 보기로 유도
  onShowPosts: (track: ChartTrack) => void;
  // 앨범아트(흰 구분선 위쪽) 클릭 — 바로 재생
  onPlay: (track: TrackSummary) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 재생 아이콘을 숨김
  currentTrackId?: string | null;
}

// 인기차트 홈 미리보기 카드(최대 10위) — 배경은 앨범아트 하나로 카드 전체를 채우고, 그 위에 흰
// 구분선으로 나눈 두 클릭 영역(위: 재생, 아래: 곡명·가수명 눌러 게시글 모음)만 얹음
export function ChartTopCard({ track, onShowPosts, onPlay, currentTrackId }: ChartTopCardProps) {
  const isPlaying = track.trackId === currentTrackId;

  return (
    <div className="relative flex-shrink-0 w-[152px] aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
      {/* 앨범커버 전체 배경 — 카드 전체를 채우는 유일한 배경 */}
      <img
        src={track.albumArtUrl}
        alt={track.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 가독성용 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

      {/* 이미지 위에 얹는 두 클릭 영역 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* 위쪽: 순위 + 재생 아이콘 — 누르면 바로 재생 */}
        <button
          onClick={() => onPlay(track)}
          aria-label={`${track.rank}위 ${track.title} 재생`}
          className="relative flex-1 min-h-0 active:scale-[0.98] transition-transform"
        >
          {!isPlaying && (
            <span className="absolute top-2 right-2">
              <Play size={24} className="ml-0.5" fill="white" stroke="white" strokeWidth={1} />
            </span>
          )}
          <span className="absolute bottom-1 left-3 text-4xl font-black italic leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            {track.rank}
          </span>
        </button>

        {/* 흰색 구분선 — 위(재생)/아래(게시글 모음) 클릭 영역을 구분 */}
        <div className="h-px mx-3 bg-white/40" aria-hidden="true" />

        {/* 아래쪽: 곡명·가수명 — 누르면 이 곡의 게시글 모음으로 이동 */}
        <button
          onClick={() => onShowPosts(track)}
          aria-label={`${track.title} 추천 게시글 보기`}
          className="flex items-center gap-1 px-3 pt-2 pb-3 text-left active:bg-black/10 transition-colors"
        >
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <div className="text-sm font-bold text-white truncate leading-tight">{track.title}</div>
            <div className="text-[10px] font-medium text-white/90 truncate leading-tight">{track.artist}</div>
          </div>
          <ChevronRight size={16} className="text-white/80 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
