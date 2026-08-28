import { LayoutGrid, Rows3 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
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
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 그리드(2열)/1열 보기 전환 UI를 이 화면에서 쓸지 여부 — 예: 최근 추가된 곡만 지원, 좋아요 한 곡은 그리드만
  enableViewToggle?: boolean;
  // 홈에서 누른 카드로 바로 스크롤하기 위한 대상 trackId
  scrollToTrackId?: string | null;
  // 지금 하단 플레이어에서 재생 중인 곡 — 해당 카드의 재생 버튼을 숨김
  currentTrackId?: string | null;
}

export function SongListScreen({
  title,
  emoji,
  subtitle,
  songs,
  onBack,
  onPlay,
  onShowAddSong,
  enableViewToggle = false,
  scrollToTrackId,
  currentTrackId,
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
    <div className="-mx-4 px-4 pb-[calc(204px+env(safe-area-inset-bottom))]">
      {/* 고정 헤더 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
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
        {filteredSongs.length === 0 ? (
          <EmptyGenreState onShowAddSong={onShowAddSong} boxed />
        ) : (
          <div className={`grid gap-3 py-1 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {filteredSongs.map((song) => (
              <div key={song.trackId} data-track-id={song.trackId}>
                <PostDetailCard
                  post={songToPostDetailCardData(song)}
                  className="w-full"
                  onPlay={() => onPlay(song)}
                  isPlaying={song.trackId === currentTrackId}
                  hideReactions={isSummaryMode}
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
