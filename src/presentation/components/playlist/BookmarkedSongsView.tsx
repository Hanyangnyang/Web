import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { useBookmarkedSongs } from '../../hooks/useRecentSongs.js';

interface BookmarkedSongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
}

export function BookmarkedSongsView({ onBack, onPlay, onShowAddSong, currentTrackId }: BookmarkedSongsViewProps) {
  const { data: songs, isLoading } = useBookmarkedSongs();

  return (
    <SongListScreen
      title="저장한 곡"
      emoji="🔖"
      subtitle=""
      songs={songs ?? []}
      isLoading={isLoading}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      enableViewToggle
      currentTrackId={currentTrackId}
    />
  );
}
