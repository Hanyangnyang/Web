import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { type Song, type TrackSummary } from '../playlistTypes';
import { useSongSearchInfinite } from '../../../hooks/playlist/useSongSearchInfinite.js';
import { useInfiniteScrollSentinel } from '../../../hooks/useInfiniteScrollSentinel.js';
import { RecentSongRow } from '../shared/RecentSongRow';
import { SongRowSkeleton } from '../shared/SongRowSkeleton';
import { PlaylistFallback } from '../shared/PlaylistFallback';
import { ErrorBoundary } from '../../common/ErrorBoundary.js';
import { EmptyMessageCard } from './EmptyMessageCard';

interface SearchPostsViewProps {
  query: string;
  onBack: () => void;
  onSelectPost: (post: Song) => void;
  onPlay: (track: TrackSummary) => void;
  currentTrackId?: string | null;
}

// 검색 결과 화면의 "추천글 더보기" — 그 검색어에 걸린 추천글 전체를 목록으로 보여주고, 아래로 내리면 다음 페이지를 이어서 불러옴
export function SearchPostsView({ query, onBack, onSelectPost, onPlay, currentTrackId }: SearchPostsViewProps) {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useSongSearchInfinite(query);
  const posts = data?.pages.flat() ?? [];

  // 목록 맨 아래 감시용 요소가 화면 근처에 오면 다음 페이지를 자동으로 불러옴(무한 스크롤)
  const sentinelRef = useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage, itemCount: posts.length });

  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="추천글 검색 결과"
        emoji="🔍"
        subtitle={`'${query}' 가 들어간 추천글을 모두 모았어요!`}
        onBack={onBack}
      />

      <ErrorBoundary name="playlist-search-posts-more" fallback={<PlaylistFallback message="추천글 검색 결과를 표시할 수 없어요" />}>
        <div className="flex flex-col gap-1.5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SongRowSkeleton key={i} className="bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]" />
            ))
          ) : isError ? (
            <EmptyMessageCard message="추천글을 불러오지 못했어요" action={{ label: '다시 시도', onClick: () => refetch() }} />
          ) : posts.length === 0 ? (
            <EmptyMessageCard message={'아직 이 검색어의 추천글이 없어요.\n첫 추천글을 남겨보세요!'} />
          ) : (
            posts.map((post) => (
              <RecentSongRow
                key={post.id ?? post.trackId}
                song={post}
                onSelect={onSelectPost}
                onPlay={onPlay}
                currentTrackId={currentTrackId}
              />
            ))
          )}
        </div>

        {/* 다음 페이지가 있으면 목록 끝에 감시 요소 + 불러오는 중 표시 */}
        {hasNextPage && (
          <div ref={sentinelRef} className="mt-1.5 flex flex-col gap-1.5">
            {isFetchingNextPage &&
              Array.from({ length: 2 }).map((_, i) => (
                <SongRowSkeleton key={i} className="bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]" />
              ))}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}
