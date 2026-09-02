import { type SongListViewBaseProps } from '../playlistTypes';
import { SongListScreen } from '../shared/SongListScreen';
import { useBookmarkedSongs } from '../../../hooks/playlist/useBookmarkedSongs.js';

interface BookmarkedSongsViewProps extends SongListViewBaseProps {
  // 저장한 곡이 없을 때 빈 상태 버튼 클릭 시 최근추가된곡 화면으로 이동
  onShowRecent: () => void;
}

export function BookmarkedSongsView({ onBack, onPlay, onShowAddSong, onShowRecent, onSelectTrack, currentTrackId, viewMode, onViewModeChange }: BookmarkedSongsViewProps) {
  // 최근추가된곡/인기차트와 동일하게 SWR로 통일 — 재방문 땐 캐시를 바로 보여주고 조용히
  // 백그라운드에서 갱신함(isLoading은 캐시가 아예 없는 최초 진입에만 true)
  const { data: songs, isLoading } = useBookmarkedSongs();

  return (
    <SongListScreen
      title="저장한 곡"
      emoji="🔖"
      subtitle=""
      songs={songs ?? []}
      isLoading={isLoading}
      emptyStateMessage="이런 곡들은 어때요?"
      emptyStateButtonLabel="최근 추가된 곡 보러가기"
      emptyStateButtonIcon={<span>🎵</span>}
      onEmptyStateAction={onShowRecent}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      onSelectTrack={onSelectTrack}
      enableViewToggle
      currentTrackId={currentTrackId}
      emptyStateBoxed={false}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />
  );
}
