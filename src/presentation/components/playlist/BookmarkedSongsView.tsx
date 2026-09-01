import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { useBookmarkedSongs } from '../../hooks/useRecentSongs.js';

interface BookmarkedSongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 저장한 곡이 없을 때 빈 상태 버튼 클릭 시 최근추가된곡 화면으로 이동
  onShowRecent: () => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
}

export function BookmarkedSongsView({ onBack, onPlay, onShowAddSong, onShowRecent, currentTrackId }: BookmarkedSongsViewProps) {
  const { data: songs, isLoading } = useBookmarkedSongs();

  return (
    <SongListScreen
      title="저장한 곡"
      emoji="🔖"
      subtitle=""
      songs={songs ?? []}
      isLoading={isLoading}
      emptyStateMessage="이런 곡들은 어때요?"
      emptyStateButtonLabel="최근 등록된 곡 보러가기"
      onEmptyStateAction={onShowRecent}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      enableViewToggle
      currentTrackId={currentTrackId}
      emptyStateBoxed={false}
    />
  );
}
