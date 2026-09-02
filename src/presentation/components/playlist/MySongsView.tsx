import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { useMySongs } from '../../hooks/useRecentSongs.js';

interface MySongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
}

export function MySongsView({ onBack, onPlay, onShowAddSong, currentTrackId }: MySongsViewProps) {
  // 최근추가된곡/인기차트와 동일하게 SWR로 통일 — 재방문 땐 캐시를 바로 보여주고 조용히
  // 백그라운드에서 갱신함(isLoading은 캐시가 아예 없는 최초 진입에만 true)
  const { data: songs, isLoading } = useMySongs();

  return (
    <SongListScreen
      title="추천한 곡"
      emoji="🎤"
      subtitle=""
      songs={songs ?? []}
      isLoading={isLoading}
      emptyStateMessage="아직 이 장르로 추천한 곡이 없어요"
      emptyStateButtonLabel="곡 추천하러 가기"
      emptyStateButtonIcon={<span>✏️</span>}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      enableViewToggle
      hideMoreButton
      currentTrackId={currentTrackId}
      emptyStateBoxed={false}
    />
  );
}
