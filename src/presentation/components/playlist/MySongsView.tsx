import { type SongListViewBaseProps } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { useMySongs } from '../../hooks/useRecentSongs.js';

type MySongsViewProps = SongListViewBaseProps;

export function MySongsView({ onBack, onPlay, onShowAddSong, onSelectTrack, currentTrackId, viewMode, onViewModeChange }: MySongsViewProps) {
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
      onSelectTrack={onSelectTrack}
      enableViewToggle
      currentTrackId={currentTrackId}
      emptyStateBoxed={false}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />
  );
}
