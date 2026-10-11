import { ChevronRight, Heart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useShareModal } from '../shared/useShareModal';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { ChartTopCard } from './ChartTopCard';
import { MySongCard } from './MySongCard';
import { RecentSongRow } from '../shared/RecentSongRow';
import { EmptyGenreState } from '../shared/EmptyGenreState';
import { RecentSongRowSkeleton } from '../shared/RecentSongRowSkeleton';
import { ChartPeriodChips } from '../shared/ChartPeriodChips';
import { GenreFilterChips, type GenreFilterState } from '../shared/GenreFilterChips';
import { PlaylistSearchBar } from '../shared/PlaylistSearchBar';
import { TrackPromoCarousel } from './TrackPromoCarousel';
import { type Song, type TrackSummary, type ChartPeriod, CHART_PERIOD_OPTIONS } from '../playlistTypes';
import { type ChartTrack } from '../../../../domain/entities/PopularityChart.js';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';

const MY_SONGS_PREVIEW_LIMIT = 10;

interface PlaylistHomeViewProps {
  onBack: () => void;
  isActive?: boolean;
  visibleSongs: Song[];
  promoRecentSongs: readonly Song[];
  // 최근 추가된 곡 미리보기의 장르 필터(비어 있으면 전체)
  recentGenreFilter: GenreFilterState;
  onChangeRecentGenreFilter: (next: GenreFilterState) => void;
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
  // trackId를 넘기면 인기차트 화면이 그 곡 위치로 스크롤해서 열림(카드 클릭용), 없으면 맨 위부터
  onShowAllChart: (trackId?: string) => void;
  onShowLiked: () => void;
  onShowAddSong: () => void;
  // "내가 추천한 곡" 섹션 — 카드 UI는 인기차트(ChartTopCard)와 동일, 순위만 없음
  mySongs: Song[];
  isMySongsLoading: boolean;
  onShowAllMySongs: () => void;
  // 카드를 누르면 내가 추천한 곡 화면으로 이동하면서 그 곡 위치로 스크롤
  onSelectMySong: (song: Song) => void;
  // true면 마운트 시 검색바에 자동으로 포커스 — "어떤 곡을 추천해볼까요?"로 홈에 돌아왔을 때 사용
  autoFocusSearch?: boolean;
  onAutoFocusSearchConsumed?: () => void;
  promoPopularTracks: readonly ChartTrack[];
  promoWeeklyTracks: readonly ChartTrack[];
  isTrackPromosLoading: boolean;
  onSelectRecentPromo: (song: Song) => void;
  onSelectChartPromo: (track: ChartTrack, period: Extract<ChartPeriod, 'popular' | 'weekly'>) => void;
}

// 에리카 플레이리스트 홈 화면 — 검색바 + 인기차트 미리보기 + 최근 추가된 곡 미리보기.
// PlaylistView(화면 전환을 관리하는 컨테이너)가 screenStack이 ['main']일 때 렌더링함
export function PlaylistHomeView({
  onBack,
  isActive = true,
  visibleSongs,
  promoRecentSongs,
  recentGenreFilter,
  onChangeRecentGenreFilter,
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
  onShowLiked,
  onShowAddSong,
  mySongs,
  isMySongsLoading,
  onShowAllMySongs,
  onSelectMySong,
  autoFocusSearch = false,
  onAutoFocusSearchConsumed,
  promoPopularTracks,
  promoWeeklyTracks,
  isTrackPromosLoading,
  onSelectRecentPromo,
  onSelectChartPromo,
}: PlaylistHomeViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 공유 모달은 화면에 하나만 두고, 누른 카드의 곡을 담아서 염 (ChartView와 같은 방식)
  const [shareTrack, setShareTrack] = useState<TrackSummary>({ trackId: '', title: '', artist: '', albumArtUrl: '' });
  const share = useShareModal(shareTrack);
  const handleShare = (t: ChartTrack) => {
    setShareTrack({ trackId: t.trackId, title: t.title, artist: t.artist, albumArtUrl: t.albumArtUrl });
    share.open();
  };

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
            onClick={onShowLiked}
            aria-label="저장한 곡 보기"
            className="relative before:content-[''] before:absolute before:-inset-2.5 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-text-main transition-shadow active:scale-95"
          >
            <Heart size={16} strokeWidth={2} className="text-red-500" fill="none" />
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
        // 헤더(아래 여백 12px)와 검색바, 검색바와 배너 사이를 똑같이 8px로 맞춤
        className="-mt-1 mb-2"
      />

      {/* 최근 추천곡·실시간 차트·주간 차트에서 한 곡씩 보여주는 홈 전용 캐러셀 */}
      {isTrackPromosLoading ? (
        <div className="mb-4">
          <div className="aspect-[4/1] rounded-2xl skeleton-shimmer" data-testid="track-promo-skeleton" />
        </div>
      ) : promoRecentSongs.length > 0 || promoPopularTracks.length > 0 || promoWeeklyTracks.length > 0 ? (
        <div className="mb-4">
          <TrackPromoCarousel
            recentSongs={promoRecentSongs}
            popularTracks={promoPopularTracks}
            weeklyTracks={promoWeeklyTracks}
            isActive={isActive}
            onSelectRecent={onSelectRecentPromo}
            onSelectChart={onSelectChartPromo}
          />
        </div>
      ) : null}

      {/* 인기차트 섹션 */}
      <section className="mb-4">
        {/* 제목 글씨와 > 아이콘 전체가 하나의 버튼 — 어디를 눌러도 해당 화면으로 이동 */}
        <h3 className="mb-2">
          <button
            onClick={() => onShowAllChart()}
            aria-label="인기차트 전체보기"
            className="relative before:content-[''] before:absolute before:-inset-y-3 before:-inset-x-2 flex items-center py-2 -my-2 text-[19px] font-bold text-text-main active:scale-[0.98] transition-transform"
          >
            <span>인기차트</span>
            <ChevronRight size={20} className="ml-0.5" />
          </button>
        </h3>

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
          <div className="bg-white rounded-card border border-playlist-primary/20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden h-[203px] flex items-center justify-center">
            <EmptyGenreState
              message={`아직 '${CHART_PERIOD_OPTIONS.find((option) => option.key === chartPeriod)?.label ?? ''}' 차트가 집계되지 않았어요`}
              buttonLabel="최근 추천된 곡 보러가기"
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
                  // 카드 어디를 눌러도 재생 없이 인기차트 화면으로 이동하면서 누른 곡 위치로 스크롤
                  onShowPosts={() => onShowAllChart(track.trackId)}
                  onPlay={() => onShowAllChart(track.trackId)}
                  // 우상단 아이콘만 별도로 동작 — 재생 아이콘은 바로 재생, 공유 아이콘은 공유 팝업
                  onPlayIcon={onPlayTrack}
                  showShareIcon
                  onShare={handleShare}
                  currentTrackId={currentTrackId}
                />
              ))}
              {/* 더보기 — 카드 캐러셀 맨 끝까지 스크롤하면 나오는 버튼(최근 추가된 곡 더보기 버튼과 동일한 디자인), 인기차트 전체보기로 이동 */}
              <button
                onClick={() => onShowAllChart()}
                aria-label="인기차트 전체보기"
                className="relative before:content-[''] before:absolute before:-inset-2 flex-shrink-0 self-center px-4 py-2.5 rounded-full text-[13px] font-bold text-text-sub bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:text-text-main transition-colors active:scale-95"
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
        {/* 제목 글씨와 > 아이콘 전체가 하나의 버튼 — 어디를 눌러도 해당 화면으로 이동 */}
        <h3 className="mb-2">
          <button
            onClick={() => onShowAllRecent()}
            aria-label="최근 추천된 곡 전체보기"
            className="relative before:content-[''] before:absolute before:-inset-y-3 before:-inset-x-2 flex items-center py-2 -my-2 text-[19px] font-bold text-text-main active:scale-[0.98] transition-transform"
          >
            <span>최근 추천된 곡</span>
            <ChevronRight size={20} className="ml-0.5" />
          </button>
        </h3>

        {/* 장르 칩 — 인기차트의 실시간/주간/월간 칩처럼 제목 아래에 두고, 고르면 아래 미리보기가 그 장르로 바뀜 */}
        <GenreFilterChips value={recentGenreFilter} onChange={onChangeRecentGenreFilter} className="mb-2" />

        {/* 최근 추가된 곡 목록 */}
        {isRecentSongsLoading ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <RecentSongRowSkeleton key={i} />
            ))}
          </div>
        ) : visibleSongs.length === 0 ? (
          <div className="bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <EmptyGenreState
              message={recentGenreFilter.selected.length > 0 ? '아직 이 장르엔 추천된 곡이 없어요' : '아직 추천된 곡이 없어요'}
              buttonLabel="곡 추천하러 가기"
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
              className="relative before:content-[''] before:absolute before:-inset-2 px-5 py-2.5 rounded-full text-[13px] font-bold text-text-sub bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:text-text-main transition-colors active:scale-95"
            >
              더보기
            </button>
          </div>
        )}
      </section>

      {/* 내가 추천한 곡 섹션 */}
      <section className="mt-4">
        {/* 제목 글씨와 > 아이콘 전체가 하나의 버튼 — 어디를 눌러도 해당 화면으로 이동 */}
        <h3 className="mb-2">
          <button
            onClick={onShowAllMySongs}
            aria-label="내가 추천한 곡 전체보기"
            className="relative before:content-[''] before:absolute before:-inset-y-3 before:-inset-x-2 flex items-center py-2 -my-2 text-[19px] font-bold text-text-main active:scale-[0.98] transition-transform"
          >
            <span>내가 추천한 곡</span>
            <ChevronRight size={20} className="ml-0.5" />
          </button>
        </h3>

        {isMySongsLoading ? (
          <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[152px] aspect-[3/4] rounded-xl skeleton-shimmer" />
              ))}
            </div>
          </div>
        ) : mySongs.length === 0 ? (
          <div className="bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <EmptyGenreState
              message="아직 추천한 곡이 없어요"
              buttonLabel="곡 추천하러 가기"
              onAction={onShowAddSong}
            />
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2 pb-2">
              {mySongs.slice(0, MY_SONGS_PREVIEW_LIMIT).map((song) => (
                <MySongCard key={song.id ?? song.trackId} track={song} onSelect={() => onSelectMySong(song)} />
              ))}
              <button
                onClick={onShowAllMySongs}
                aria-label="내가 추천한 곡 전체보기"
                className="relative before:content-[''] before:absolute before:-inset-2 flex-shrink-0 self-center px-4 py-2.5 rounded-full text-[13px] font-bold text-text-sub bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:text-text-main transition-colors active:scale-95"
              >
                더보기
              </button>
              <div className="w-1 flex-shrink-0" aria-hidden="true" />
            </div>
          </div>
        )}
      </section>

      {share.node}
    </div>
  );
}
