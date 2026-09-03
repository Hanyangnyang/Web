import { LayoutGrid, Rows3 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { type Song, type TrackSummary, filterSongsByGenre } from '../playlistTypes';
import { PostDetailCard, songToPostDetailCardData } from './PostDetailCard';
import { PostDetailCardSkeleton } from './PostDetailCardSkeleton';
import { EmptyGenreState } from './EmptyGenreState';
import { GenreFilterChips } from './GenreFilterChips';
import { type RecentSongsTapAreaVariant } from '../../../hooks/playlist/usePlaylistExperiment';

// 그리드/리스트 보기 전환 버튼 코치마크를 한 번 봤는지 — 다시 안 뜨게 기기에 남겨둔다
// (캠퍼스맵의 '뭐먹지' 코치마크와 동일한 방식)
const VIEW_TOGGLE_COACHMARK_SEEN_KEY = 'viewToggleCoachmarkSeen';

interface SongListScreenProps {
  title: string;
  emoji?: string;
  subtitle?: string;
  songs: Song[];
  // true면 목록이 아직 로딩 중이라 EmptyGenreState 대신 로딩 표시를 보여줌
  isLoading?: boolean;
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동
  onSelectTrack?: (track: TrackSummary) => void;
  // 빈 상태 문구/버튼/동작을 화면마다 다르게 하고 싶을 때 오버라이드 — 없으면 장르 안내 문구 + 곡추천하기로 기본 동작
  emptyStateMessage?: string;
  emptyStateButtonLabel?: string;
  emptyStateButtonIcon?: ReactNode;
  onEmptyStateAction?: () => void;
  // 그리드(2열)/1열 보기 전환 UI를 이 화면에서 쓸지 여부 — 예: 최근 추가된 곡만 지원
  enableViewToggle?: boolean;
  // 뷰 모드를 상위(PlaylistView)에서 제어하고 싶을 때 넘김 — 게시글 상세로 갔다가 뒤로가기로 돌아와도
  // 이 화면이 통째로 언마운트/리마운트되면서 내부 state가 초기화되는데, 상위에 보관해두면 마지막으로
  // 보던 모드가 그대로 유지됨. 안 넘기면 이 화면 내부 state로만 관리(항상 1열로 시작)
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 카드의 재생 아이콘이 일시정지 아이콘으로 바뀜
  currentTrackId?: string | null;
  // 빈 상태를 흰 카드 박스로 감쌀지 — 최근추가된곡의 카드 그리드와 톤을 맞추려는 화면(기본값)용.
  // 저장한 곡/내가 등록한 곡처럼 배경이 이미 흰 화면에서는 굳이 박스가 필요 없어 false로 끔
  emptyStateBoxed?: boolean;
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트에서 카드 재생 버튼 배정값 — RecentSongsView만 넘겨줌.
  // 안 넘기면 PostDetailCard가 기존(control) 동작으로 렌더링됨
  playButtonVariant?: RecentSongsTapAreaVariant;
}

export function SongListScreen({
  title,
  emoji,
  subtitle,
  songs,
  isLoading = false,
  onBack,
  onPlay,
  onShowAddSong,
  onSelectTrack,
  emptyStateMessage,
  emptyStateButtonLabel,
  emptyStateButtonIcon,
  onEmptyStateAction,
  enableViewToggle = false,
  scrollToTrackId,
  currentTrackId,
  emptyStateBoxed = true,
  viewMode: viewModeProp,
  onViewModeChange,
  playButtonVariant,
}: SongListScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>(enableViewToggle ? 'list' : 'grid');
  const viewMode = viewModeProp ?? internalViewMode;
  const setViewMode = (mode: 'grid' | 'list') => {
    onViewModeChange?.(mode);
    setInternalViewMode(mode);
  };
  // 홈 진입 스크롤 + 요약 카드 클릭 시 스크롤을 같은 상태로 관리 — 값이 바뀌지 않는 한 그리드⇄리스트를
  // 오가도 같은 카드를 계속 다시 스크롤해서 보여주므로, 2열에서 카드를 눌러 1열로 갔다가 다시 2열
  // 토글 버튼을 눌러 돌아와도 그 카드가 보이던 위치 그대로 복원됨
  const [scrollTarget, setScrollTarget] = useState<string | null>(scrollToTrackId ?? null);
  const filteredSongs = filterSongsByGenre(songs, selectedGenre);

  // 2열은 요약 목록, 1열은 상세 — 토글이 켜진 화면에서 2열일 때만 요약 취급
  const isSummaryMode = enableViewToggle && viewMode === 'grid';

  const listContainerRef = useRef<HTMLDivElement>(null);

  // 대상이 생기거나(홈 진입/요약 카드 클릭) 뷰 모드가 바뀌어 목록 DOM이 다시 그려질 때마다 해당 카드로 부드럽게 스크롤
  useLayoutEffect(() => {
    if (!scrollTarget) return;
    const target = listContainerRef.current?.querySelector<HTMLElement>(`[data-track-id="${scrollTarget}"]`);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [viewMode, scrollTarget]);

  // 요약 목록(2열)에서 카드를 누르면 그 곡의 상세(1열)로 전환
  const handleSelectSummary = (song: Song) => {
    setScrollTarget(song.trackId);
    setViewMode('list');
  };

  // 그리드 보기 전환 버튼 코치마크 — 처음 온 사람에게만, 잠깐 떴다 사라진다(뭐먹지 코치마크와 동일한 실험)
  const [viewToggleCoachmark, setViewToggleCoachmark] = useState<'hidden' | 'visible' | 'leaving'>(() => {
    if (!enableViewToggle) return 'hidden';
    try {
      return localStorage.getItem(VIEW_TOGGLE_COACHMARK_SEEN_KEY) ? 'hidden' : 'visible';
    } catch {
      return 'hidden';
    }
  });
  useEffect(() => {
    if (viewToggleCoachmark !== 'visible') return;
    try { localStorage.setItem(VIEW_TOGGLE_COACHMARK_SEEN_KEY, '1'); } catch {}
    const t = setTimeout(() => setViewToggleCoachmark('leaving'), 3000);
    return () => clearTimeout(t);
  }, [viewToggleCoachmark]);

  return (
    <div className="-mx-4 px-4 pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      {/* 고정 헤더 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-white/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader
          title={title}
          emoji={emoji}
          subtitle={subtitle}
          onBack={onBack}
          rightAction={
            enableViewToggle ? (
              <div className="relative">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  aria-label={viewMode === 'grid' ? '1열로 보기' : '2열로 보기'}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-text-main transition-shadow active:scale-95"
                >
                  {viewMode === 'grid' ? <Rows3 size={16} strokeWidth={2} /> : <LayoutGrid size={16} strokeWidth={2} />}
                </button>

                {/* 그리드 보기 코치마크 — 버튼 존재를 알려주려고 3초만 떴다 사라진다 */}
                {viewToggleCoachmark !== 'hidden' && (
                  <div
                    className={`absolute right-0 top-full mt-2 z-40 w-max pointer-events-none ${viewToggleCoachmark === 'visible' ? '[animation:fadeIn_0.3s_ease-out]' : '[animation:fadeOut_0.4s_ease-in_forwards]'}`}
                    onAnimationEnd={() => { if (viewToggleCoachmark === 'leaving') setViewToggleCoachmark('hidden'); }}
                  >
                    <div className="relative whitespace-nowrap bg-gradient-to-br from-[#A78BFA] to-[#8B5CF6] text-white text-[12.5px] font-extrabold leading-snug px-3.5 py-2.5 rounded-2xl shadow-[0_6px_18px_rgba(139,92,246,0.35)]">
                      그리드로도 볼 수 있어요!🔲
                      <span className="absolute -top-1.5 right-3 w-3 h-3 bg-[#8B5CF6] rotate-45 rounded-[2px]" />
                    </div>
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
        <GenreFilterChips
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          className="pb-3"
        />
      </div>
      {/* 곡 리스트 — 인스타그램 피드처럼 2열 카드 그리드 또는 1열 리스트 */}
      <div ref={listContainerRef} className="-mx-4 px-2">
        {isLoading ? (
          <div className={`grid gap-3 py-1 ${viewMode === 'grid' ? 'grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
            {Array.from({ length: viewMode === 'grid' ? 4 : 3 }).map((_, i) => (
              <PostDetailCardSkeleton key={i} variant={viewMode === 'grid' ? 'grid' : 'card'} />
            ))}
          </div>
        ) : filteredSongs.length === 0 ? (
          <EmptyGenreState
            onAction={onEmptyStateAction ?? onShowAddSong}
            message={emptyStateMessage}
            buttonLabel={emptyStateButtonLabel}
            buttonIcon={emptyStateButtonIcon}
            boxed={emptyStateBoxed}
          />
        ) : (
          <div className={`grid gap-3 py-1 ${viewMode === 'grid' ? 'grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
            {filteredSongs.map((song) => (
              <div key={song.id ?? song.trackId} data-track-id={song.trackId} className={viewMode === 'grid' ? 'h-full' : undefined}>
                <PostDetailCard
                  post={songToPostDetailCardData(song)}
                  // 2열(그리드)에서는 같은 행 카드끼리 높이를 맞춤 — 본문 길이가 짧은 카드도 옆 카드 높이만큼 늘어남
                  className={viewMode === 'grid' ? 'w-full h-full' : 'w-full'}
                  onPlay={() => onPlay(song)}
                  isPlaying={song.trackId === currentTrackId}
                  hideReactions={isSummaryMode}
                  onSelect={isSummaryMode ? () => handleSelectSummary(song) : undefined}
                  onSelectTrack={onSelectTrack}
                  playButtonVariant={playButtonVariant}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
