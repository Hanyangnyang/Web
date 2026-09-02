import { LayoutGrid, Rows3 } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { type Song, filterSongsByGenre } from './playlistTypes';
import { PostDetailCard, songToPostDetailCardData } from './PostDetailCard';
import { EmptyGenreState } from './EmptyGenreState';
import { GenreFilterChips } from './GenreFilterChips';

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
  // 빈 상태 문구/버튼/동작을 화면마다 다르게 하고 싶을 때 오버라이드 — 없으면 장르 안내 문구 + 곡추천하기로 기본 동작
  emptyStateMessage?: string;
  emptyStateButtonLabel?: string;
  emptyStateButtonIcon?: ReactNode;
  onEmptyStateAction?: () => void;
  // 그리드(2열)/1열 보기 전환 UI를 이 화면에서 쓸지 여부 — 예: 최근 추가된 곡만 지원
  enableViewToggle?: boolean;
  // true면 카드의 더보기(신고하기) 버튼을 숨김 — 본인이 등록한 곡 목록처럼 자기 자신을 신고할 수 없는 화면용
  hideMoreButton?: boolean;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 카드의 재생 버튼을 숨김
  currentTrackId?: string | null;
  // 빈 상태를 흰 카드 박스로 감쌀지 — 최근추가된곡의 카드 그리드와 톤을 맞추려는 화면(기본값)용.
  // 저장한 곡/내가 등록한 곡처럼 배경이 이미 흰 화면에서는 굳이 박스가 필요 없어 false로 끔
  emptyStateBoxed?: boolean;
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
  emptyStateMessage,
  emptyStateButtonLabel,
  emptyStateButtonIcon,
  onEmptyStateAction,
  enableViewToggle = false,
  hideMoreButton = false,
  scrollToTrackId,
  currentTrackId,
  emptyStateBoxed = true,
}: SongListScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(enableViewToggle ? 'list' : 'grid');
  // 홈 진입 스크롤 + 요약 카드 클릭 시 스크롤을 같은 상태로 관리
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
              <button
                onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
                aria-label={viewMode === 'grid' ? '1열로 보기' : '2열로 보기'}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-text-main transition-shadow active:scale-95"
              >
                {viewMode === 'grid' ? <Rows3 size={16} strokeWidth={2} /> : <LayoutGrid size={16} strokeWidth={2} />}
              </button>
            ) : undefined
          }
        />
        <GenreFilterChips
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          variant="list"
          className="pb-3"
        />
      </div>
      {/* 곡 리스트 — 인스타그램 피드처럼 2열 카드 그리드 또는 1열 리스트 */}
      <div ref={listContainerRef} className="-mx-4 px-2">
        {isLoading ? (
          <div className={`grid gap-3 py-1 ${viewMode === 'grid' ? 'grid-cols-2 items-stretch' : 'grid-cols-1'}`}>
            {Array.from({ length: viewMode === 'grid' ? 4 : 3 }).map((_, i) =>
              viewMode === 'grid' ? (
                <div key={i} className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="w-full aspect-square skeleton-shimmer" />
                  <div className="px-4 pt-3 pb-4 flex-1 flex flex-col gap-2">
                    <div className="h-4 w-3/4 rounded-full skeleton-shimmer" />
                    <div className="h-3 w-1/2 rounded-full skeleton-shimmer" />
                    <div className="h-3 w-full rounded-full skeleton-shimmer" />
                    <div className="h-3 w-16 rounded-full skeleton-shimmer mt-auto" />
                  </div>
                </div>
              ) : (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="w-full aspect-square skeleton-shimmer" />
                  <div className="px-4 pt-3 pb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-full skeleton-shimmer flex-shrink-0" />
                      <div className="h-5 w-14 rounded-full skeleton-shimmer" />
                    </div>
                    <div className="h-4 w-1/2 rounded-full skeleton-shimmer mb-2" />
                    <div className="h-3.5 w-full rounded-full skeleton-shimmer mb-1.5" />
                    <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer mb-3" />
                    <div className="h-3 w-24 rounded-full skeleton-shimmer" />
                  </div>
                </div>
              )
            )}
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
                  hideMoreButton={hideMoreButton}
                  onSelect={isSummaryMode ? () => handleSelectSummary(song) : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
