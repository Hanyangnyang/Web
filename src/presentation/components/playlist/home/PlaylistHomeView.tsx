import { ChevronRight, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { ChartTopCard } from './ChartTopCard';
import { RecentSongRow } from '../shared/RecentSongRow';
import { EmptyGenreState } from '../shared/EmptyGenreState';
import { ChartPeriodChips } from '../shared/ChartPeriodChips';
import { PlaylistSearchBar } from '../shared/PlaylistSearchBar';
import { type Song, type TrackSummary, type ChartPeriod, CHART_PERIOD_OPTIONS } from '../playlistTypes';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';

interface PlaylistHomeViewProps {
  onBack: () => void;
  visibleSongs: Song[];
  isRecentSongsLoading: boolean;
  visibleChart: ChartTrack[];
  isChartLoading: boolean;
  chartPeriod: ChartPeriod;
  onChangeChartPeriod: (period: ChartPeriod) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmitSearch: () => void;
  // true면 홈 미리보기의 마지막 곡 위치까지 부드럽게 내려간 뒤 전체 목록을 보여줌(더보기 버튼용). 헤더 화살표는 항상 맨 위부터
  onShowAllRecent: (scrollToLastPreview?: boolean) => void;
  onSelectRecentSong: (song: Song) => void;
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정값 — RecentSongRow에 그대로 전달 (docs/playlist-recent-songs-ab-test.md 참고)
  recentSongsVariant?: RecentSongsTapAreaVariant;
  // 인기차트/최근 추가된 곡 카드의 앨범아트 클릭 — 바로 재생
  onPlayTrack: (track: TrackSummary) => void;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 카드의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  onShowAllChart: () => void;
  onShowPosts: (track: ChartTrack) => void;
  onShowMyActivity: () => void;
  onShowAddSong: () => void;
  // true면 마운트 시 검색바에 자동으로 포커스 — "어떤 곡을 추천해볼까요?"로 홈에 돌아왔을 때 사용
  autoFocusSearch?: boolean;
  onAutoFocusSearchConsumed?: () => void;
}

// 에리카 플레이리스트 홈 화면 — 검색바 + 인기차트 미리보기 + 최근 추가된 곡 미리보기.
// PlaylistView(화면 전환을 관리하는 컨테이너)가 screenStack이 ['main']일 때 렌더링함
export function PlaylistHomeView({
  onBack,
  visibleSongs,
  isRecentSongsLoading,
  visibleChart,
  isChartLoading,
  chartPeriod,
  onChangeChartPeriod,
  searchQuery,
  setSearchQuery,
  onSubmitSearch,
  onShowAllRecent,
  onSelectRecentSong,
  recentSongsVariant = 'control',
  onPlayTrack,
  currentTrackId,
  onShowAllChart,
  onShowPosts,
  onShowMyActivity,
  onShowAddSong,
  autoFocusSearch = false,
  onAutoFocusSearchConsumed,
}: PlaylistHomeViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocusSearch) return;
    searchInputRef.current?.focus();
    onAutoFocusSearchConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들의 추천곡을 들어보고, 나도 추천해봐요!"
        onBack={onBack}
        rightAction={
          <button
            onClick={onShowMyActivity}
            aria-label="내 활동 보기"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-text-main transition-shadow active:scale-95"
          >
            <User size={16} strokeWidth={2} />
          </button>
        }
      />

      {/* 검색바: Enter 또는 오른쪽 화살표를 누르면 검색 결과 화면으로 이동 */}
      <PlaylistSearchBar
        ref={searchInputRef}
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={onSubmitSearch}
        placeholder="듣고 싶은 곡을 검색해보세요!"
      />

      {/* 인기차트 섹션 */}
      <section className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-lg font-bold text-text-main">인기차트</h3>
          <button
            onClick={onShowAllChart}
            className="flex items-center justify-center text-text-sub hover:text-text-main transition-colors active:scale-95"
            aria-label="인기차트 전체보기"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 실시간 / 주간 / 월간 칩 */}
        <ChartPeriodChips chartPeriod={chartPeriod} onChangePeriod={onChangeChartPeriod} />

        {/* 카드 가로 스크롤 */}
        {isChartLoading ? (
          <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[152px] aspect-[3/4] rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : visibleChart.length === 0 ? (
          <div className="bg-white rounded-card border border-[#618CE9]/20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden h-[203px] flex items-center justify-center">
            <EmptyGenreState
              message={`아직 '${CHART_PERIOD_OPTIONS.find((option) => option.key === chartPeriod)?.label ?? ''}' 차트가 집계되지 않았어요`}
              buttonLabel="최근 추가된 곡 보러가기"
              buttonIcon={<span>🎵</span>}
              onAction={onShowAllRecent}
            />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2 pb-2">
              {visibleChart.map((track) => (
                <ChartTopCard
                  key={track.trackId}
                  track={track}
                  onShowPosts={onShowPosts}
                  onPlay={onPlayTrack}
                  currentTrackId={currentTrackId}
                />
              ))}
              {/* 더보기 — 카드 캐러셀 맨 끝까지 스크롤하면 나오는 버튼(최근 추가된 곡 더보기 버튼과 동일한 디자인), 인기차트 전체보기로 이동 */}
              <button
                onClick={onShowAllChart}
                aria-label="인기차트 전체보기"
                className="flex-shrink-0 self-center px-4 py-2.5 rounded-full text-sm font-bold text-text-sub bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:text-text-main transition-colors active:scale-95"
              >
                더보기
              </button>
              <div className="w-1 flex-shrink-0" aria-hidden="true" />
            </div>
          </div>
        )}
      </section>

      {/* 최근 추가된 곡 섹션 */}
      <section>
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-lg font-bold text-text-main">최근 추가된 곡</h3>
          <button
            onClick={() => onShowAllRecent()}
            className="flex items-center justify-center text-text-sub hover:text-text-main transition-colors active:scale-95"
            aria-label="최근 추가된 곡 전체보기"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 최근 추가된 곡 목록 */}
        {isRecentSongsLoading ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]">
                <div className="w-12 h-12 rounded skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-1/3 rounded-full skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleSongs.length === 0 ? (
          <div className="bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <EmptyGenreState
              message="아직 추가된 곡이 없어요"
              buttonLabel="곡 추천하러 가기"
              buttonIcon={<span>✏️</span>}
              onAction={onShowAddSong}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {visibleSongs.map((song) => (
              <RecentSongRow
                key={song.id ?? song.trackId}
                song={song}
                onSelect={onSelectRecentSong}
                onPlay={onPlayTrack}
                currentTrackId={currentTrackId}
                variant={recentSongsVariant}
              />
            ))}
          </div>
        )}

        {/* 더보기 — 최근 추가된 곡 전체보기로 이동 */}
        {!isRecentSongsLoading && visibleSongs.length > 0 && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => onShowAllRecent(true)}
              className="px-7 py-2.5 rounded-full text-sm font-bold text-text-sub bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:text-text-main transition-colors active:scale-95"
            >
              더보기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
