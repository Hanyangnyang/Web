import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';

interface RecentSongsViewProps {
  songs: Song[];
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
}

export function RecentSongsView({ songs, onBack, onPlay, onShowAddSong }: RecentSongsViewProps) {
  return (
    <SongListScreen
      title="최근 추가된 곡"
      emoji="🎵"
      subtitle=""
      songs={songs}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
    />
  );
}
