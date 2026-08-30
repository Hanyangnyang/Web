import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { DUMMY_BOOKMARKED_SONGS } from './playlistDummyData';

interface BookmarkedSongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
}

export function BookmarkedSongsView({ onBack, onPlay, onShowAddSong, currentTrackId }: BookmarkedSongsViewProps) {
  return (
    <SongListScreen
      title="북마크한 곡"
      emoji="🔖"
      subtitle=""
      songs={DUMMY_BOOKMARKED_SONGS}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      currentTrackId={currentTrackId}
    />
  );
}
