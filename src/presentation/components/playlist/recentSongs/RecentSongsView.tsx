import { type Song, type SongListViewBaseProps } from '../playlistTypes';
import { SongListScreen } from '../shared/SongListScreen';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';

interface RecentSongsViewProps extends SongListViewBaseProps {
  songs: Song[];
  // 장르 필터 결과가 없을 때 "어떤 곡을 추천해볼까?" 버튼 클릭 시 검색 화면으로 이동
  onShowSearch: () => void;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정값 (docs/playlist-recent-songs-ab-test.md 참고)
  playButtonVariant?: RecentSongsTapAreaVariant;
}

export function RecentSongsView({ songs, onBack, onPlay, onShowAddSong, onShowSearch, onSelectTrack, scrollToTrackId, currentTrackId, viewMode, onViewModeChange, playButtonVariant }: RecentSongsViewProps) {
  return (
    <SongListScreen
      title="최근 추가된 곡"
      emoji="🎵"
      subtitle="에리카생들이 이제 막 추천한 곡들을 확인해보세요!"
      songs={songs}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      onSelectTrack={onSelectTrack}
      onEmptyStateAction={onShowSearch}
      emptyStateButtonLabel="어떤 곡을 추천해볼까요?"
      emptyStateButtonIcon={<span>🔍</span>}
      enableViewToggle
      scrollToTrackId={scrollToTrackId}
      currentTrackId={currentTrackId}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      playButtonVariant={playButtonVariant}
    />
  );
}
