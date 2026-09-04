import { ChevronRight, Pause, Play } from 'lucide-react';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';
import { type TrackSummary } from '../playlistTypes';

interface ChartTopCardProps {
  track: ChartTrack;
  // 이 곡에 달린 추천 게시글 목록(캐러셀)을 보여달라는 요청 — 북마크가 "곡"이 아니라 "게시글"에 귀속돼서
  // 여러 게시글이 있을 수 있는 곡 하나에 바로 붙일 수 없어 상세 보기로 유도
  onShowPosts: (track: ChartTrack) => void;
  // 앨범아트(흰 구분선 위쪽) 클릭 — 바로 재생
  onPlay: (track: TrackSummary) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 같으면 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  // 카드 너비 — 기본은 홈 미리보기의 가로 스크롤용 고정폭(152px). 소식탭 홍보 카드처럼 부모가 폭을
  // 나눠줄 때는 예) "w-full flex-1"을 넘겨서 덮어쓴다 (Tailwind 클래스 병합 충돌을 피하려고 별도 prop으로 분리)
  widthClassName?: string;
  // 카드 높이 — 기본은 3:4 비율로 폭에 맞춰 자동 계산. 부모가 높이를 이미 정해준 상황(예: 소식탭
  // 캐러셀에서 다른 슬라이드 높이에 맞춰야 할 때)에는 "h-full"을 넘겨서 비율 대신 그 높이를 그대로 채운다
  heightClassName?: string;
}

// 인기차트 홈 미리보기 카드(최대 10위) — 배경은 앨범아트 하나로 카드 전체를 채우고, 그 위에 흰
// 구분선으로 나눈 두 클릭 영역(위: 재생, 아래: 곡명·가수명 눌러 게시글 모음)만 얹음
export function ChartTopCard({ track, onShowPosts, onPlay, currentTrackId, widthClassName = 'w-[152px] flex-shrink-0', heightClassName = 'aspect-[3/4]' }: ChartTopCardProps) {
  const isPlaying = track.trackId === currentTrackId;

  return (
    <div className={`relative ${widthClassName} ${heightClassName} rounded-xl overflow-hidden shadow-lg`}>
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
          aria-label={isPlaying ? `${track.rank}위 ${track.title} 일시정지` : `${track.rank}위 ${track.title} 재생`}
          className="relative flex-1 min-h-0 active:scale-[0.98] transition-transform"
        >
          <span className="absolute top-2 right-2">
            {isPlaying ? (
              <Pause size={24} fill="white" stroke="white" strokeWidth={1} />
            ) : (
              <Play size={24} className="ml-0.5" fill="white" stroke="white" strokeWidth={1} />
            )}
          </span>
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
            <div className="text-xs font-medium text-white/90 truncate leading-tight">{track.artist}</div>
          </div>
          <ChevronRight size={16} className="text-white/80 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
