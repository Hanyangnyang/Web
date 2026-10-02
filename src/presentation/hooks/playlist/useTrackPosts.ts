// 훅(ViewModel): 특정 곡(trackId)에 달린 추천 게시글 모아보기 — 정렬(sort)이 바뀌면 queryKey가 달라져서 자동으로 다시 불러옴
import { useQuery } from '@tanstack/react-query';
import { getTrackPostsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong } from '../../components/playlist/playlistTypes.js';

export type TrackPostsSort = 'latest' | 'popular';

// TrackPostCollectionView의 최신/인기 칩이 쓰는 값 → 백엔드 sort 파라미터 형식으로 변환
const TRACK_POSTS_SORT_PARAM: Record<TrackPostsSort, string> = {
  latest: 'createdAt,desc',
  popular: 'heartCount,desc',
};

const TRACK_POSTS_SIZE = 50;

export function useTrackPosts(trackId: string, sort: TrackPostsSort) {
  return useQuery({
    queryKey: ['playlist', 'track-posts', trackId, sort],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const result = await getTrackPostsUseCase.execute({
        trackId,
        deviceId,
        sort: TRACK_POSTS_SORT_PARAM[sort],
        size: TRACK_POSTS_SIZE,
      });
      return {
        trackId: result.trackId,
        title: result.title,
        artist: result.artist,
        albumArtUrl: result.albumArtUrl,
        totalSongsCount: result.totalSongsCount,
        totalHeartCount: result.totalHeartCount,
        totalPlayCount: result.totalPlayCount,
        posts: result.posts.map(mapPlaylistSongToSong),
      };
    },
    enabled: !!trackId,
    staleTime: 0,
  });
}
