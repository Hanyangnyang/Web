import { type SongListViewBaseProps } from '../playlistTypes';
import { SongListScreen } from '../shared/SongListScreen';
import { type GenreFilterState } from '../shared/GenreFilterChips';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';
import { useRecentSongsInfinite } from '../../../hooks/playlist/useRecentSongsInfinite.js';
import { useMySongsInfinite } from '../../../hooks/playlist/useMySongsInfinite.js';

interface RecentSongsViewProps extends SongListViewBaseProps {
  // 장르 필터 결과가 없을 때 "어떤 곡을 추천해볼까?" 버튼 클릭 시 검색 화면으로 이동
  onShowSearch: () => void;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // false면 스크롤만 하고 카드 강조는 생략 (홈 "더보기"처럼 특정 곡을 누른 게 아닐 때)
  highlightScrollTarget?: boolean;
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정값 (docs/playlist-recent-songs-ab-test.md 참고)
  playButtonVariant?: RecentSongsTapAreaVariant;
  // 홈 미리보기와 동기화되는 장르 필터(선택 + 칩 위치)
  genreFilter: GenreFilterState;
  onGenreFilterChange: (next: GenreFilterState) => void;
  // "내 추천" 칩 — 켜면 내가 추천한 곡만 보여줌. 홈 미리보기와 같은 값을 공유(PlaylistView가 보관)
  mineOnly: boolean;
  onMineOnlyChange: (mineOnly: boolean) => void;
}

export function RecentSongsView({ onBack, onPlay, onShowAddSong, onShowSearch, onSelectTrack, scrollToTrackId, highlightScrollTarget, currentTrackId, viewMode, onViewModeChange, playButtonVariant, genreFilter, onGenreFilterChange, mineOnly, onMineOnlyChange }: RecentSongsViewProps) {
  // 홈 미리보기와 같은 캐시를 20개씩 이어 받는 무한 스크롤 — 장르 칩을 고르면 서버가 그 장르 곡만 페이징해서 줌
  const recent = useRecentSongsInfinite(genreFilter.selected[0]);
  // "내 추천"을 켰을 때만 받음 — 최근 목록에서 내 글만 걸러내면 20개 페이지마다 몇 개 안 남아 스켈레톤만 길게 이어지므로
  // 내가 추천한 곡 API로 바꿔 받음(내가 추천한 곡 화면과 같은 캐시). 이 API는 장르 필터가 없어서 장르는 SongListScreen이 받은 곡에서 거름
  const mine = useMySongsInfinite(mineOnly);
  const { songs, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = mineOnly ? mine : recent;
  const isGenreSelected = genreFilter.selected.length > 0;

  return (
    <SongListScreen
      title="최근 추천된 곡"
      emoji="🎵"
      songs={songs ?? []}
      isLoading={isLoading}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      onSelectTrack={onSelectTrack}
      onEmptyStateAction={onShowSearch}
      emptyStateMessage={mineOnly ? (isGenreSelected ? '아직 이 장르로 추천한 곡이 없어요' : '아직 추천한 곡이 없어요') : undefined}
      emptyStateButtonLabel="어떤 곡을 추천해볼까요?"
      mineOnly={mineOnly}
      onMineOnlyChange={onMineOnlyChange}
      enableViewToggle
      scrollToTrackId={scrollToTrackId}
      highlightScrollTarget={highlightScrollTarget}
      currentTrackId={currentTrackId}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      playButtonVariant={playButtonVariant}
      genreFilter={genreFilter}
      onGenreFilterChange={onGenreFilterChange}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}
