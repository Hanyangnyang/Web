import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { DUMMY_LIKED_SONGS } from './playlistDummyData';

interface LikedSongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
}

export function LikedSongsView({ onBack, onPlay, onShowAddSong }: LikedSongsViewProps) {
  return (
    <SongListScreen
      title="좋아요 한 곡"
      emoji="🙆"
      subtitle=""
      songs={DUMMY_LIKED_SONGS}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
    />
  );
}
