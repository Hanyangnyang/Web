import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { ChartSongRow } from './ChartSongRow';
import { EmptyGenreState } from '../shared/EmptyGenreState';
import { ChartPeriodChips } from '../shared/ChartPeriodChips';
import { SongRowSkeleton } from '../shared/SongRowSkeleton';
import { PlaylistFallback } from '../shared/PlaylistFallback';
import { ErrorBoundary } from '../../common/ErrorBoundary.js';
import { useLikeToast } from '../shared/useLikeToast';
import { useChartTrackLike } from '../../../hooks/playlist/useChartTrackLike.js';
import { type ChartPeriod, CHART_PERIOD_OPTIONS } from '../playlistTypes';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';

interface ChartViewProps {
  chart: ChartTrack[];
  isLoading: boolean;
  // 조회 실패 — 받아둔 목록이 없을 때만 빈 상태 대신 폴백("불러올 수 없어요" + 다시 시도)을 보여줌
  isError: boolean;
  onRetry: () => void;
  chartPeriod: ChartPeriod;
  onChangePeriod: (period: ChartPeriod) => void;
  onBack: () => void;
  onShowRecent: () => void;
  onPlay: (track: ChartTrack) => void;
  onShowPosts: (track: ChartTrack) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 행의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
}

// 인기차트 상세 화면 — 홈 미리보기(최대 10곡)와 달리 전체 차트를 보여줌
export function ChartView({ chart, isLoading, isError, onRetry, chartPeriod, onChangePeriod, onBack, onShowRecent, onPlay, onShowPosts, currentTrackId }: ChartViewProps) {
  const likeToast = useLikeToast();
  const { toggle } = useChartTrackLike(likeToast.show, likeToast.hide);

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="인기차트"
        emoji="🔥"
        subtitle="에리카생들이 가장 많이 들은 곡"
        onBack={onBack}
      />

      <ChartPeriodChips chartPeriod={chartPeriod} onChangePeriod={onChangePeriod} />

      {/* 차트 리스트 */}
      <div className="bg-white rounded-card border border-playlist-primary/20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200 font-semibold text-xs text-gray-600 bg-slate-50">
          <span className="w-7 text-center">순위</span>
          <div className="flex-1">곡정보</div>
          <div className="flex items-center gap-3">
            <span className="w-9 text-center">듣기</span>
            <span className="w-9 text-center">좋아요</span>
            <span className="w-9 text-center">공유</span>
          </div>
        </div>

        {/* 리스트 — 로딩 중엔 ChartSongRow와 동일한 레이아웃(순위/앨범아트/곡정보/좋아요/듣기/공유)의 스켈레톤을 보여줌.
            key=chartPeriod: 렌더 에러로 폴백이 뜬 뒤에도 기간 칩을 바꾸면 경계가 새로 마운트돼서 다시 시도됨 */}
        <ErrorBoundary
          key={chartPeriod}
          name="playlist-chart"
          fallback={<PlaylistFallback message="인기차트를 표시할 수 없어요" minHeight={208} className="!border-0 !rounded-none" />}
        >
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <SongRowSkeleton
              key={i}
              className="border-b border-slate-200"
              leading={<div className="w-7 h-4 rounded-full skeleton-shimmer flex-shrink-0" />}
              trailing={
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full skeleton-shimmer flex-shrink-0" />
                  <div className="w-5 h-5 rounded-full skeleton-shimmer flex-shrink-0" />
                  <div className="w-5 h-5 rounded-full skeleton-shimmer flex-shrink-0" />
                </div>
              }
            />
          ))
        ) : isError && chart.length === 0 ? (
          // 조회 실패(네트워크·서버·응답 검증 실패)를 "아직 집계 안 됨"으로 오해하지 않도록 빈 상태와 분리.
          // 재조회가 실패해도 이미 받아둔 목록이 있으면 그걸 그대로 보여줌
          <PlaylistFallback message="인기차트를 불러올 수 없어요" onRetry={onRetry} minHeight={208} className="!border-0 !rounded-none" />
        ) : chart.length === 0 ? (
          <EmptyGenreState
            message={`아직 '${CHART_PERIOD_OPTIONS.find((option) => option.key === chartPeriod)?.label ?? ''}' 차트가 집계되지 않았어요`}
            buttonLabel="최근 추가된 곡 보러가기"
            buttonIcon={<span>🎵</span>}
            onAction={onShowRecent}
          />
        ) : (
          chart.map((track) => (
            <ChartSongRow
              key={track.trackId}
              track={track}
              onPlay={onPlay}
              onShowPosts={onShowPosts}
              onToggleLike={(t) => toggle(t.trackId, t.isLiked)}
              currentTrackId={currentTrackId}
            />
          ))
        )}
        </ErrorBoundary>
      </div>
      {likeToast.node}
    </div>
  );
}
