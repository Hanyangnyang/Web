import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';
import { type Song, type SongListViewBaseProps, type TrackSummary } from '../playlistTypes';
import { RecentSongsPreviewSection } from '../shared/RecentSongsPreviewSection';
import { SongListScreen } from '../shared/SongListScreen';
import { useLikedSongs } from '../../../hooks/playlist/useLikedSongs.js';

interface LikedSongsViewProps extends Omit<SongListViewBaseProps, 'viewMode' | 'onViewModeChange' | 'onPlay'> {
  // 최근 추가된 곡 미리보기 행은 TrackSummary로 재생을 요청하므로 Song보다 넓게 받음(Song도 TrackSummary라 그대로 호환)
  onPlay: (track: TrackSummary) => void;
  // 저장한 곡이 없을 때 빈 상태 버튼(좋아요 누르러 가기) 클릭 시 최근추가된곡 화면으로 이동
  onShowRecent: () => void;
  // 저장한 곡이 없을 때 빈 상태 아래에 보여줄 최근 추가된 곡 미리보기(검색 결과 화면 하단과 동일)
  recentSongs: Song[];
  isRecentSongsLoading: boolean;
  onSelectRecentSong: (song: Song) => void;
  recentSongsVariant?: RecentSongsTapAreaVariant;
}

export function LikedSongsView({ onBack, onPlay, onShowAddSong, onShowRecent, onSelectTrack, currentTrackId, recentSongs, isRecentSongsLoading, onSelectRecentSong, recentSongsVariant = 'control' }: LikedSongsViewProps) {
  // 최근추가된곡/인기차트와 동일하게 SWR로 통일 — 재방문 땐 캐시를 바로 보여주고 조용히
  // 백그라운드에서 갱신함(isLoading은 캐시가 아예 없는 최초 진입에만 true). 20개씩 이어 받는 무한 스크롤
  const { songs, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useLikedSongs();

  return (
    <SongListScreen
      title="저장한 곡"
      emoji="❤️"
      subtitle=""
      songs={songs ?? []}
      isLoading={isLoading}
      emptyStateMessage="아직 저장한 곡이 없어요"
      emptyStateButtonLabel="좋아요 누르러 가기"
      onEmptyStateAction={onShowRecent}
      emptyStateFooter={
        // 목록 컨테이너가 좌우 8px만 띄워 놓아서(-mx-4 px-2) 검색 결과 화면과 같은 16px 여백이 되도록 px-2를 더함
        <div className="px-2">
          <RecentSongsPreviewSection
            onShowRecent={onShowRecent}
            recentSongs={recentSongs}
            isLoading={isRecentSongsLoading}
            onSelectRecentSong={onSelectRecentSong}
            onPlay={onPlay}
            currentTrackId={currentTrackId}
            variant={recentSongsVariant}
          />
        </div>
      }
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      onSelectTrack={onSelectTrack}
      gridOnly
      currentTrackId={currentTrackId}
      emptyStateBoxed={false}
      hideMineBadge
      hideGenreFilter
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}
