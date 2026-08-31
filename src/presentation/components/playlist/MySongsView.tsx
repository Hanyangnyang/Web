import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { DUMMY_MY_SONGS } from './playlistDummyData';

interface MySongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
}

export function MySongsView({ onBack, onPlay, onShowAddSong, currentTrackId }: MySongsViewProps) {
  return (
    <SongListScreen
      title="내가 등록한 곡"
      emoji="🎤"
      subtitle=""
      songs={DUMMY_MY_SONGS}
      emptyStateMessage="아직 이 장르로 추천한 곡이 없어요"
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      enableViewToggle
      hideMoreButton
      currentTrackId={currentTrackId}
    />
  );
}
