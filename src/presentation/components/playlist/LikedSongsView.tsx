import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { DUMMY_LIKED_SONGS } from './playlistDummyData';

interface LikedSongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
}

export function LikedSongsView({ onBack, onPlay, onShowAddSong, currentTrackId }: LikedSongsViewProps) {
  return (
    <SongListScreen
      title="좋아요 한 곡"
      emoji="🙆"
      subtitle=""
      songs={DUMMY_LIKED_SONGS}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      currentTrackId={currentTrackId}
    />
  );
}
