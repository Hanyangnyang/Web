import { useState } from 'react';
import { MiscSubViewHeader } from '../../misc/MiscSubViewHeader';
import { type Song, type TrackSummary } from '../playlistTypes';
import { type MusicSearchTrack } from '../../../../domain/entities/MusicSearchTrack.js';
import { useSongSearch } from '../../../hooks/playlist/useSongSearch.js';
import { useMusicSearch, normalizeMusicSearchQuery } from '../../../hooks/playlist/useMusicSearch.js';
import { useRetryCountdown, getSearchErrorMessage } from '../../../hooks/playlist/useRetryCountdown.js';
import { RecentSongRow } from '../shared/RecentSongRow';
import { MusicSearchResultCard } from '../shared/MusicSearchResultCard';
import { PlaylistSearchBar } from '../shared/PlaylistSearchBar';
import { SongRowSkeleton } from '../shared/SongRowSkeleton';
import { PlaylistFallback } from '../shared/PlaylistFallback';
import { ErrorBoundary } from '../../common/ErrorBoundary.js';
import { EmptyMessageCard } from './EmptyMessageCard';

interface SearchResultsViewProps {
  query: string;
  onBack: () => void;
  onSelectTrack: (track: TrackSummary) => void;
  onSelectPost: (post: Song) => void;
  onPlay: (track: TrackSummary) => void; // 곡 검색 결과의 앨범커버를 눌렀을 때 하단 플레이어로 재생
  currentTrackId?: string | null; // 지금 하단 플레이어에서 재생 중인 곡 
  onRecommendTrack: (track: TrackSummary) => void; // 곡 검색 결과 카드의 "✏️ 곡 추천하기" 버튼
}

// 검색 최소 글자수
const MIN_QUERY_LENGTH = 2;

// 검색 결과 화면
export function SearchResultsView({ query, onBack, onSelectTrack, onSelectPost, onPlay, currentTrackId, onRecommendTrack }: SearchResultsViewProps) {
  // 처음 진입 시 검색어(query prop)로 시작하고, 이 화면 안에서 재검색하면 activeQuery만 갱신 —
  // query prop 자체는 부모(PlaylistView)의 홈 검색바 상태라 건드리지 않음
  const [activeQuery, setActiveQuery] = useState(query);
  const { data: postResults, isLoading: isSearchingPosts } = useSongSearch(activeQuery);
  const [localQuery, setLocalQuery] = useState(query);
  const { data: trackResultsData, isFetching: isSearching, error: musicSearchError, refetch: refetchMusicSearch } = useMusicSearch(activeQuery);
  const trackResults: MusicSearchTrack[] = trackResultsData ?? [];
  const { remainingSeconds: retryRemainingSeconds, isBlocked: isRetryBlocked } = useRetryCountdown(musicSearchError);
  const searchError = getSearchErrorMessage(musicSearchError, retryRemainingSeconds);

  // 검색바에서 Enter를 치거나 화살표 버튼을 누르면 재검색
  const handleResearch = () => {
    const trimmed = localQuery.trim();
    if (!trimmed || isSearching || isRetryBlocked) return;
    // 직전 검색이 실패(429 등)한 같은 검색어면 쿼리 키가 그대로라 setState만으로는 재조회가 안 나가서 직접 refetch
    if (musicSearchError && normalizeMusicSearchQuery(trimmed) === normalizeMusicSearchQuery(activeQuery)) {
      refetchMusicSearch();
      return;
    }
    setActiveQuery(trimmed);
  };

  return (
    <div className="-mx-4 px-4 pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      {/* 고정 헤더 */}
      <div className="sticky -top-6 -mt-6 z-[100] bg-surface/90 backdrop-blur-xl pt-6 -mx-4 px-4 rounded-b-xl border-b border-slate-200/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <MiscSubViewHeader
          title="검색 결과"
          emoji="🔍"
          subtitle={`'${activeQuery}' 에 대한 검색 결과`}
          onBack={onBack}
        />
      </div>

      {/* 검색바 */}
      <PlaylistSearchBar
        value={localQuery}
        onChange={setLocalQuery}
        onSubmit={handleResearch}
        placeholder="곡 제목이나 아티스트로 검색해보세요"
        className="mt-4 mb-4"
      />

      {/* 1. Spotify 곡 검색 결과 */}
      <section className="mb-3">
        <h3 className="text-lg font-bold text-text-main mb-2">곡</h3>
        {/* key=activeQuery: 렌더 에러로 폴백이 뜬 뒤에도 새로 검색하면 경계가 새로 마운트돼서 다시 시도됨 */}
        <ErrorBoundary
          key={activeQuery}
          name="playlist-search-tracks"
          fallback={<PlaylistFallback message="곡 검색 결과를 표시할 수 없어요" minHeight={208} />}
        >
        <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3 pb-2">
            {activeQuery.trim().length < MIN_QUERY_LENGTH ? (
              <EmptyMessageCard message={`최소 ${MIN_QUERY_LENGTH}자 이상 입력해주세요!`} minHeight={208} />
            ) : isSearching ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-36 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="w-full aspect-square skeleton-shimmer" />
                  <div className="px-2 py-1.5">
                    <div className="h-3.5 w-24 rounded-full skeleton-shimmer" />
                    <div className="mt-1.5 h-3 w-16 rounded-full skeleton-shimmer" />
                    {/* 게시글 N개 줄 자리 */}
                    <div className="mt-1 h-2.5 w-14 rounded-full skeleton-shimmer" />
                  </div>
                  {/* 세 번째 행(곡 추천하기) 자리 */}
                  <div className="h-7 flex items-center justify-center">
                    <div className="h-3 w-20 rounded-full skeleton-shimmer" />
                  </div>
                </div>
              ))
            ) : searchError ? (
              <EmptyMessageCard message={searchError} minHeight={208} />
            ) : trackResults.length === 0 ? (
              <EmptyMessageCard message="검색 결과가 없어요" minHeight={208} />
            ) : (
              trackResults.map((track) => (
                <MusicSearchResultCard
                  key={track.trackId}
                  track={track}
                  onPlay={onPlay}
                  isPlaying={track.trackId === currentTrackId}
                  onSelect={onSelectTrack}
                  selectLabel={`${track.title} 추천 게시글 보기`}
                  onRecommend={onRecommendTrack}
                />
              ))
            )}
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
        </ErrorBoundary>
      </section>

      <div className="border-t border-slate-200 mb-3" />

      {/* 2. 우리 서비스에 등록된 게시글 */}
      <section>
        <h3 className="text-lg font-bold text-text-main mb-2">게시글</h3>
        <ErrorBoundary
          key={activeQuery}
          name="playlist-search-posts"
          fallback={<PlaylistFallback message="게시글 검색 결과를 표시할 수 없어요" />}
        >
        <div className="flex flex-col gap-1.5">
          {isSearchingPosts ? (
            Array.from({ length: 3 }).map((_, i) => (
              <SongRowSkeleton key={i} className="bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)]" />
            ))
          ) : activeQuery.trim().length < MIN_QUERY_LENGTH ? (
            <EmptyMessageCard message={`최소 ${MIN_QUERY_LENGTH}자 이상 입력해주세요!`} />
          ) : !postResults || postResults.length === 0 ? (
            <EmptyMessageCard message="검색 결과가 없어요" />
          ) : (
            postResults.map((post) => (
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
        </ErrorBoundary>
      </section>
    </div>
  );
}
