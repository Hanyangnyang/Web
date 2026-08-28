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
  const filteredSongs = filterSongsByGenre(songs, selectedGenre);

  const listContainerRef = useRef<HTMLDivElement>(null);

  // 화면 진입 시 1회 — 홈에서 선택했던 카드가 있으면 그 위치로 부드럽게 스크롤
  useLayoutEffect(() => {
    if (!scrollToTrackId) return;
    const target = listContainerRef.current?.querySelector<HTMLElement>(`[data-track-id="${scrollToTrackId}"]`);
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
