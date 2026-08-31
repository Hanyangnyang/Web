// 훅(ViewModel): 최근추가된곡 화면의 플레이리스트 피드 곡 목록 로딩 + 곡 추천/등록/신고/좋아요(북마크)/재생기록/이모지반응/곡별게시글모아보기
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRecentSongsUseCase,
  getSongByIdUseCase,
  getSongCreationStatusUseCase,
  getBookmarkedSongsUseCase,
  submitSongUseCase,
  reportSongUseCase,
  toggleBookmarkUseCase,
  recordTrackPlayUseCase,
  toggleReactionUseCase,
  getTrackPostsUseCase,
  getPopularityChartUseCase,
} from '../../di.js';
import { getOrCreateAnonymousUserId } from '../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song, type PlaylistReaction, type ChartPeriod } from '../components/playlist/playlistTypes.js';
import type { ChartType } from '../../domain/repositories/IPlaylistRepository.js';

const RECENT_SONGS_QUERY_KEY = ['playlist', 'recent-songs'];
const RECENT_SONGS_SIZE = 50;
// 다른 사용자가 방금 추천한 곡이 바로 보여야 하는 실시간성 있는 피드라, 전역 기본값(15분)보다 훨씬 짧게 둠
const RECENT_SONGS_STALE_TIME = 60 * 1000;

export function useRecentSongs() {
  return useQuery<Song[]>({
    queryKey: RECENT_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getRecentSongsUseCase.execute({ deviceId, size: RECENT_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: RECENT_SONGS_STALE_TIME,
  });
}

// 게시글 단건 상세 조회 — 게시글 목록(TrackPostsView 등)에서 하나를 눌러 상세화면(PostDetailView)으로 이동할 때 사용.
// postId가 없으면(딥링크 대상이 아직 없는 화면 등) 호출하지 않음
export function usePostDetail(postId: string | null) {
  return useQuery({
    queryKey: ['playlist', 'post-detail', postId],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const song = await getSongByIdUseCase.execute({ songId: postId as string, deviceId });
      return mapPlaylistSongToSong(song);
    },
    enabled: !!postId,
  });
}

// 곡추천하기 화면 진입 시 1일 3곡 제한/최근 7일 중복 추천 사전 확인. 등록 후 다시 들어오면
// 값이 바뀌어있을 수 있어서(예: 1곡 등록 후 재진입) staleTime 0으로 화면 진입마다 최신값을 다시 불러옴
export function useSongCreationStatus() {
  return useQuery({
    queryKey: ['playlist', 'creation-status'],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      return getSongCreationStatusUseCase.execute({ deviceId });
    },
    staleTime: 0,
  });
}

const BOOKMARKED_SONGS_SIZE = 50;

// 북마크한 곡 화면용 — 북마크 토글은 여러 화면(최근추가된곡/곡별게시글모아보기 등)에서 흩어져 일어나서
// 이 목록 자체를 실시간으로 갱신 대상에 넣기보단, 화면 진입(컴포넌트 재마운트)마다 최신값을 다시 불러옴
export function useBookmarkedSongs() {
  return useQuery<Song[]>({
    queryKey: ['playlist', 'bookmarked-songs'],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getBookmarkedSongsUseCase.execute({ deviceId, size: BOOKMARKED_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}

export interface SubmitSongInput {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: string[];
}

// 곡 추천/등록 — 성공하면 최근추가된곡 쿼리 캐시 맨 앞에 바로 얹어서, 재조회 없이 즉시 화면에 반영
export function useSubmitSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      const song = await submitSongUseCase.execute({ ...input, deviceId });
      return mapPlaylistSongToSong(song);
    },
    onSuccess: (song) => {
      queryClient.setQueryData<Song[]>(RECENT_SONGS_QUERY_KEY, (prev) => (prev ? [song, ...prev] : [song]));
    },
  });
}

export interface ReportSongInput {
  songId: string;
  reason: string;
}

// 곡 신고하기 — 접수 성공 여부만 필요해서 결과값은 없음
export function useReportSong() {
  return useMutation({
    mutationFn: async ({ songId, reason }: ReportSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      await reportSongUseCase.execute({ songId, deviceId, reason });
    },
  });
}

// 좋아요(북마크) 토글 — 서버가 현재 상태 보고 등록/취소를 알아서 판단하므로 songId만 넘기면 됨.
// 결과 isLiked로 화면 상태를 서버 값과 맞춤(낙관적 업데이트는 호출부에서 처리)
export function useToggleBookmark() {
  return useMutation({
    mutationFn: async (songId: string) => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleBookmarkUseCase.execute({ songId, deviceId });
    },
  });
}

// 재생 버튼이 눌리는 곳 어디서든 호출하는 재생수 기록(인기차트 집계용) — 결과를 화면에서 안 써서 fire-and-forget
export function useRecordTrackPlay() {
  return useMutation({
    mutationFn: (trackId: string) => recordTrackPlayUseCase.execute(trackId),
  });
}

export interface ToggleReactionInput {
  songId: string;
  reactionType: string;
}

// 이모지 반응 토글 — 이모지 버튼이 눌리는 곳 어디서든. 서버가 그 곡의 9종 반응 전체 최신 카운트를
// 함께 내려주므로, 호출부는 결과를 그대로 화면 상태에 덮어씌우면 됨(낙관적 업데이트는 호출부에서 처리)
export function useToggleReaction() {
  return useMutation({
    mutationFn: async (input: ToggleReactionInput): Promise<PlaylistReaction[]> => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleReactionUseCase.execute({ ...input, deviceId });
    },
  });
}

export type TrackPostsSort = 'latest' | 'popular';

// TrackPostsView의 최신/인기 칩이 쓰는 값 → 백엔드 sort 파라미터 형식으로 변환
const TRACK_POSTS_SORT_PARAM: Record<TrackPostsSort, string> = {
  latest: 'createdAt,desc',
  popular: 'heartCount,desc',
};

const TRACK_POSTS_SIZE = 50;

// 특정 곡(trackId)에 달린 추천 게시글 모아보기 — 정렬(sort)이 바뀌면 queryKey가 달라져서 자동으로 다시 불러옴
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
        posts: result.posts.map(mapPlaylistSongToSong),
      };
    },
    enabled: !!trackId,
  });
}

// 홈 미리보기의 CHART_PERIOD_OPTIONS 키('실시간' 등) → 백엔드 차트 유형 파라미터
const CHART_PERIOD_TO_TYPE: Record<ChartPeriod, ChartType> = {
  popular: 'RISING',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

// 자주 갱신될 필요는 없어서 전역 기본값(15분)보다 좀 더 여유 있게 둠
const CHART_STALE_TIME = 5 * 60 * 1000;

// 인기 차트(실시간 급상승/주간/월간) — period가 바뀌면 queryKey가 달라져서 자동으로 다시 불러옴
export function usePopularityChart(period: ChartPeriod) {
  return useQuery({
    queryKey: ['playlist', 'chart', period],
    queryFn: () => getPopularityChartUseCase.execute({ type: CHART_PERIOD_TO_TYPE[period] }),
    staleTime: CHART_STALE_TIME,
  });
}
