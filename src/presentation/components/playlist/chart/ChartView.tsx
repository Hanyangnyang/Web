import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { ChartSongRow } from './ChartSongRow';
import { EmptyGenreState } from '../shared/EmptyGenreState';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChartPeriodChips } from '../shared/ChartPeriodChips';
import { type GenreFilterState } from '../shared/GenreFilterChips';
import { GenreFilterDropdown } from '../shared/GenreFilterDropdown';
import { SongRowSkeleton } from '../shared/SongRowSkeleton';
import { PlaylistFallback } from '../shared/PlaylistFallback';
import { ErrorBoundary } from '../../common/ErrorBoundary.js';
import { useShareModal } from '../shared/useShareModal';
import { type ChartPeriod, type TrackSummary, CHART_PERIOD_OPTIONS } from '../playlistTypes';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';

interface ChartViewProps {
  chart: ChartTrack[];
  isLoading: boolean;
  // 조회 실패 — 받아둔 목록이 없을 때만 빈 상태 대신 폴백("불러올 수 없어요" + 다시 시도)을 보여줌
  isError: boolean;
  onRetry: () => void;
  chartPeriod: ChartPeriod;
  onChangePeriod: (period: ChartPeriod) => void;
  // 홈에서 누른 카드의 곡으로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // 스크롤+강조를 한 번 마친 뒤 호출 — 상위가 대상을 비워서, 곡 상세에 갔다 돌아와 이 화면이 다시 마운트돼도 효과가 반복되지 않게 함
  onScrollTargetConsumed?: () => void;
  // 기간 칩 오른쪽 장르 드롭다운 — 고른 장르의 차트만 서버에서 받아옴(비어 있으면 전체)
  genreFilter: GenreFilterState;
  onGenreFilterChange: (next: GenreFilterState) => void;
  onBack: () => void;
  onShowRecent: () => void;
  onPlay: (track: ChartTrack) => void;
  onShowPosts: (track: ChartTrack) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 행의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
}

// 인기차트 상세 화면 — 홈 미리보기(최대 10곡)와 달리 전체 차트를 보여줌
export function ChartView({ chart, isLoading, isError, onRetry, chartPeriod, onChangePeriod, scrollToTrackId, onScrollTargetConsumed, genreFilter, onGenreFilterChange, onBack, onShowRecent, onPlay, onShowPosts, currentTrackId }: ChartViewProps) {
  // 공유 모달은 화면에 하나만 두고, 누른 행의 곡을 담아서 염 — 행마다 모달 상태를 들고 있지 않게
  const [shareTrack, setShareTrack] = useState<TrackSummary>({ trackId: '', title: '', artist: '', albumArtUrl: '' });
  const share = useShareModal(shareTrack);
  const handleShare = (t: ChartTrack) => {
    setShareTrack({ trackId: t.trackId, title: t.title, artist: t.artist, albumArtUrl: t.albumArtUrl });
    share.open();
  };
  const listRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  const [highlightedTrackId, setHighlightedTrackId] = useState<string | null>(null);

  // 홈의 인기차트 카드를 눌러 들어오면, 목록이 그려진 뒤 그 곡 행이 화면 가운데 오도록 한 번만 부드럽게 스크롤
  useLayoutEffect(() => {
    if (!scrollToTrackId || scrolledRef.current) return;
    const target = listRef.current?.querySelector<HTMLElement>(`[data-track-id="${scrollToTrackId}"]`);
    if (!target) return;
    scrolledRef.current = true;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setHighlightedTrackId(scrollToTrackId);
    onScrollTargetConsumed?.();
  }, [scrollToTrackId, chart]); // eslint-disable-line react-hooks/exhaustive-deps

  // 강조는 잠깐만 — 스크롤이 끝난 뒤 한 번 번쩍이고 사라지면 표시도 걷어냄(다시 렌더돼도 애니메이션이 재시작되지 않게)
  useEffect(() => {
    if (!highlightedTrackId) return;
    const timer = setTimeout(() => setHighlightedTrackId(null), 2400);
    return () => clearTimeout(timer);
  }, [highlightedTrackId]);

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      {/* 고정 헤더 — 최근 추가된 곡(SongListScreen)과 같은 방식. 스크롤해도 제목과 기간·장르 필터가 상단에 남음 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-white pt-6 -mx-4 px-4 mb-2 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader
          title="인기차트"
          emoji="🔥"
          subtitle="에리카생들이 가장 많이 들은 곡"
          onBack={onBack}
        />

        {/* 기간 칩 한 줄 — 오른쪽 끝에 장르 드롭다운 */}
        <div className="flex items-center justify-between gap-2 -mt-1.5 pb-2">
          <ChartPeriodChips chartPeriod={chartPeriod} onChangePeriod={onChangePeriod} className="!mb-0" />
          <GenreFilterDropdown value={genreFilter} onChange={onGenreFilterChange} />
        </div>
      </div>

      {/* 차트 리스트 */}
      <div ref={listRef} className="bg-white rounded-card border border-playlist-primary/20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200 font-semibold text-[13px] text-gray-600 bg-slate-50">
          <span className="w-7 text-center">순위</span>
          <div className="flex-1">곡정보</div>
          <div className="flex items-center">
            <span className="w-10 text-center">듣기</span>
            <span className="w-9 text-center">공유</span>
          </div>
        </div>

        {/* 리스트 */}
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
            message={genreFilter.selected.length > 0
              ? '이 장르의 차트가 아직 집계되지 않았어요'
              : `아직 '${CHART_PERIOD_OPTIONS.find((option) => option.key === chartPeriod)?.label ?? ''}' 차트가 집계되지 않았어요`}
            buttonLabel="최근 추가된 곡 보러가기"
            onAction={onShowRecent}
          />
        ) : (
          chart.map((track) => (
            <ChartSongRow
              key={track.trackId}
              track={track}
              onPlay={onPlay}
              onShowPosts={onShowPosts}
              onShare={handleShare}
              currentTrackId={currentTrackId}
              highlighted={track.trackId === highlightedTrackId}
            />
          ))
        )}
        </ErrorBoundary>
      </div>
      {share.node}
    </div>
  );
}
