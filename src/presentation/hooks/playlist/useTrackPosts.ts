// 훅(ViewModel): 특정 곡(trackId)에 달린 추천 게시글 모아보기 — 정렬(sort)이 바뀌면 queryKey가 달라져서 자동으로 다시 불러옴.
// 20개씩 이어 받는 무한 스크롤 — 곡 정보는 첫 페이지 값을 쓰고 posts는 지금까지 받은 페이지를 이어 붙여서 돌려줌
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { getTrackPostsUseCase } from '../../../di.js';
import type { TrackPosts } from '../../../domain/entities/TrackPosts.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong } from '../../components/playlist/playlistTypes.js';

export type TrackPostsSort = 'latest' | 'popular';

// TrackPostCollectionView의 최신/인기 칩이 쓰는 값 → 백엔드 sort 파라미터 형식으로 변환
const TRACK_POSTS_SORT_PARAM: Record<TrackPostsSort, string> = {
  latest: 'createdAt,desc',
  popular: 'heartCount,desc',
};

const TRACK_POSTS_PAGE_SIZE = 20;

// 모듈 레벨로 둬서 참조가 고정 — data가 같으면 react-query가 결과 객체를 재사용해서,
// 화면의 [data] 의존 effect가 렌더마다 다시 돌지 않음
function selectTrackPosts(data: InfiniteData<TrackPosts, number>) {
  const first = data.pages[0];
  return {
    trackId: first.trackId,
    title: first.title,
    artist: first.artist,
    albumArtUrl: first.albumArtUrl,
    totalSongsCount: first.totalSongsCount,
    likeCount: first.likeCount,
    totalPlayCount: first.totalPlayCount,
    // 곡 단위 좋아요 상태 — 최상위 값이라 추천글이 0개여도 맞고, 다음 페이지를 받아도 안 바뀜
    isLiked: first.isLiked,
    posts: data.pages.flatMap((page) => page.posts.map(mapPlaylistSongToSong)),
  };
}

export function useTrackPosts(trackId: string, sort: TrackPostsSort) {
  const query = useInfiniteQuery({
    queryKey: ['playlist', 'track-posts', trackId, sort],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const deviceId = await getOrCreateAnonymousUserId();
      return getTrackPostsUseCase.execute({
        trackId,
        deviceId,
        sort: TRACK_POSTS_SORT_PARAM[sort],
        page: pageParam,
        size: TRACK_POSTS_PAGE_SIZE,
      });
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.last ? undefined : allPages.length),
    select: selectTrackPosts,
    enabled: !!trackId,
    staleTime: 0,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
