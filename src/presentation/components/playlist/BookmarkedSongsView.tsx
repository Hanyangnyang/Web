import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { useBookmarkedSongs } from '../../hooks/useRecentSongs.js';
import { type TrackResult } from './SearchResultsView';

interface BookmarkedSongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 저장한 곡이 없을 때 빈 상태 버튼 클릭 시 최근추가된곡 화면으로 이동
  onShowRecent: () => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동
  onSelectTrack?: (track: TrackResult) => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
  // 뷰 모드(그리드/리스트)를 상위(PlaylistView)에서 제어 — 게시글 상세로 갔다가 뒤로가기로 돌아와도
  // 마지막으로 보던 모드가 유지되게 하기 위함
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function BookmarkedSongsView({ onBack, onPlay, onShowAddSong, onShowRecent, onSelectTrack, currentTrackId, viewMode, onViewModeChange }: BookmarkedSongsViewProps) {
  // 최근추가된곡/인기차트와 동일하게 SWR로 통일 — 재방문 땐 캐시를 바로 보여주고 조용히
  // 백그라운드에서 갱신함(isLoading은 캐시가 아예 없는 최초 진입에만 true)
  const { data: songs, isLoading } = useBookmarkedSongs();

  return (
    <SongListScreen
      title="저장한 곡"
      emoji="🔖"
      subtitle=""
      songs={songs ?? []}
      isLoading={isLoading}
      emptyStateMessage="이런 곡들은 어때요?"
      emptyStateButtonLabel="최근 추가된 곡 보러가기"
      emptyStateButtonIcon={<span>🎵</span>}
      onEmptyStateAction={onShowRecent}
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
