import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';
import { type TrackResult } from './SearchResultsView';

interface RecentSongsViewProps {
  songs: Song[];
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 장르 필터 결과가 없을 때 "어떤 곡을 추천해볼까?" 버튼 클릭 시 검색 화면으로 이동
  onShowSearch: () => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동
  onSelectTrack?: (track: TrackResult) => void;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
  // 뷰 모드(그리드/리스트)를 상위(PlaylistView)에서 제어 — 게시글 상세로 갔다가 뒤로가기로 돌아와도
  // 마지막으로 보던 모드가 유지되게 하기 위함
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function RecentSongsView({ songs, onBack, onPlay, onShowAddSong, onShowSearch, onSelectTrack, scrollToTrackId, currentTrackId, viewMode, onViewModeChange }: RecentSongsViewProps) {
  return (
    <SongListScreen
      title="최근 추가된 곡"
      emoji="🎵"
      subtitle=""
      songs={songs}
      onBack={onBack}
      onPlay={onPlay}
      onShowAddSong={onShowAddSong}
      onSelectTrack={onSelectTrack}
      onEmptyStateAction={onShowSearch}
      emptyStateButtonLabel="어떤 곡을 추천해볼까요?"
      emptyStateButtonIcon={<span>🔍</span>}
      enableViewToggle
      scrollToTrackId={scrollToTrackId}
      currentTrackId={currentTrackId}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />
  );
}
