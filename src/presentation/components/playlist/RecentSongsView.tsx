import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';

interface RecentSongsViewProps {
  songs: Song[];
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
}

export function RecentSongsView({ songs, onBack, onPlay, onShowAddSong, scrollToTrackId, currentTrackId }: RecentSongsViewProps) {
  return (
    <SongListScreen
      title="최근 추가된 곡"
      emoji="🎵"
      subtitle=""
      songs={songs}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      enableViewToggle
      scrollToTrackId={scrollToTrackId}
      currentTrackId={currentTrackId}
    />
  );
}
