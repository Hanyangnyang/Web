// 훅(ViewModel): 최근추가된곡 화면의 플레이리스트 피드 곡 목록 로딩 + 곡 추천/등록/신고/좋아요(북마크)/재생기록/이모지반응/곡별게시글모아보기
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  getRecentSongsUseCase,
  getSongByIdUseCase,
  getSongCreationStatusUseCase,
  getBookmarkedSongsUseCase,
  getMySongsUseCase,
  searchSongsUseCase,
  submitSongUseCase,
  reportSongUseCase,
  toggleBookmarkUseCase,
  recordTrackPlayUseCase,
  toggleReactionUseCase,
  getTrackPostsUseCase,
  getPopularityChartUseCase,
  searchMusicTracksUseCase,
} from '../../di.js';
import { getOrCreateAnonymousUserId } from '../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song, type PlaylistReaction, type ChartPeriod, type TrackSummary } from '../components/playlist/playlistTypes.js';
import type { ChartType } from '../../domain/repositories/IPlaylistRepository.js';
import type { MusicSearchRateLimitError } from '../../domain/entities/MusicSearchTrack.js';

const RECENT_SONGS_QUERY_KEY = ['playlist', 'recent-songs'];
const RECENT_SONGS_SIZE = 50;

export function useRecentSongs() {
  return useQuery<Song[]>({
    queryKey: RECENT_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getRecentSongsUseCase.execute({ deviceId, size: RECENT_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}

// 게시글 단건 상세 조회 — 게시글 목록(TrackPostCollectionView 등)에서 하나를 눌러 상세화면(PostView)으로 이동할 때 사용.
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
    staleTime: 0,
  });
}

// 곡추천하기 화면 진입 시 1일 3곡 제한/최근 7일 중복 추천 사전 확인
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

// 저장한 곡 화면용
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

const MY_SONGS_SIZE = 20;

// 내가 등록한 곡 화면용
export function useMySongs() {
  return useQuery<Song[]>({
    queryKey: ['playlist', 'my-songs'],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getMySongsUseCase.execute({ deviceId, size: MY_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}

const SONG_SEARCH_SIZE = 20;
// useMusicSearch(Spotify 곡 검색)와 공유하는 최소 글자 수 — 이보다 짧으면 호출하지 않음
const SONG_SEARCH_MIN_LENGTH = 2;

// 검색 결과 화면의 "게시글" 섹션 — 제목/가수명/코멘트 가중치 통합 검색
export function useSongSearch(keyword: string) {
  const trimmed = keyword.trim();

  return useQuery<Song[]>({
    queryKey: ['playlist', 'song-search', trimmed],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await searchSongsUseCase.execute({ keyword: trimmed, deviceId, size: SONG_SEARCH_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    enabled: trimmed.length >= SONG_SEARCH_MIN_LENGTH,
    staleTime: 0,
  });
}

// Spotify 검색 결과는 잠깐 사이에 잘 안 바뀌니, 같은 검색어를 다시 눌러도(예: 곡추천하기에서
// 검색 버튼 연타) 이 시간 안엔 네트워크를 다시 안 태우고 캐시를 그대로 씀
const MUSIC_SEARCH_STALE_TIME_MS = 30 * 1000;

// 곡추천하기/검색결과 화면의 곡(Spotify) 검색 — 429(요청 제한) 등 실패 시 자체 백오프 UX(버튼 비활성화)를
// 호출부가 직접 만들므로, react-query의 기본 자동 재시도(defaultOptions.queries.retry: 2)는 꺼둠
export function useMusicSearch(query: string) {
  // 연속 공백은 한 칸으로 접어서, 같은 의미의 검색어가 다른 캐시 키로 흩어지는 걸 막음
  const trimmed = query.trim().replace(/\s+/g, ' ');

  return useQuery<TrackSummary[], MusicSearchRateLimitError>({
    queryKey: ['playlist', 'music-search', trimmed],
    queryFn: () => searchMusicTracksUseCase.execute(trimmed),
    enabled: trimmed.length >= SONG_SEARCH_MIN_LENGTH,
    staleTime: MUSIC_SEARCH_STALE_TIME_MS,
    retry: false,
  });
}

// 최근추가된곡/저장한곡/내가등록한곡 화면은 모두 이 세 캐시 중 하나에서 목록을 읽는데, 화면을 나갔다 들어오면
// SongListScreen/PostDetailCard가 통째로 리마운트되면서 카드 안에서만 들고 있던 낙관적 업데이트(북마크/반응)가
// 사라진다. 그 시점에 이 캐시들이 아직 옛날 값이면(백그라운드 refetch가 안 끝났으면) 방금 한 반응이 안 보였다가,
// 다음번 재진입에야(그땐 refetch가 이미 끝나서) 보이는 것처럼 느껴짐 — 그래서 토글 성공 시 여기 캐시들도 같이 패치
const SONG_LIST_QUERY_KEYS = [
  ['playlist', 'recent-songs'],
  ['playlist', 'bookmarked-songs'],
  ['playlist', 'my-songs'],
];

function patchSongInListCaches(queryClient: QueryClient, songId: string, patch: (song: Song) => Song) {
  for (const key of SONG_LIST_QUERY_KEYS) {
    queryClient.setQueryData<Song[]>(key, (prev) => prev?.map((song) => (song.id === songId ? patch(song) : song)));
  }
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
    mutationKey: ['playlist', 'submit-song'], // Sentry에서 어느 뮤테이션이 실패했는지 구분하는 태그로 쓰임
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
    mutationKey: ['playlist', 'report-song'],
    mutationFn: async ({ songId, reason }: ReportSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      await reportSongUseCase.execute({ songId, deviceId, reason });
    },
  });
}

// 좋아요(북마크) 토글 — 서버가 현재 상태 보고 등록/취소를 알아서 판단하므로 songId만 넘기면 됨.
// 결과 isLiked로 화면 상태를 서버 값과 맞춤(낙관적 업데이트는 호출부에서 처리)
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['playlist', 'toggle-bookmark'],
    mutationFn: async (songId: string) => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleBookmarkUseCase.execute({ songId, deviceId });
    },
    onSuccess: (isLiked, songId) => {
      patchSongInListCaches(queryClient, songId, (song) => ({ ...song, isBookmarked: isLiked }));
    },
  });
}

// 재생 버튼이 눌리는 곳 어디서든 호출하는 재생수 기록(인기차트 집계용) — 결과를 화면에서 안 써서 fire-and-forget
export function useRecordTrackPlay() {
  return useMutation({
    mutationKey: ['playlist', 'record-track-play'],
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['playlist', 'toggle-reaction'],
    mutationFn: async (input: ToggleReactionInput): Promise<PlaylistReaction[]> => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleReactionUseCase.execute({ ...input, deviceId });
    },
    onSuccess: (updatedReactions, input) => {
      patchSongInListCaches(queryClient, input.songId, (song) => ({ ...song, reactions: updatedReactions }));
    },
  });
}

export type TrackPostsSort = 'latest' | 'popular';

// TrackPostCollectionView의 최신/인기 칩이 쓰는 값 → 백엔드 sort 파라미터 형식으로 변환
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
        totalHeartCount: result.totalHeartCount,
        totalPlayCount: result.totalPlayCount,
        posts: result.posts.map(mapPlaylistSongToSong),
      };
    },
    enabled: !!trackId,
    staleTime: 0,
  });
}

// 홈 미리보기의 CHART_PERIOD_OPTIONS 키('실시간' 등) → 백엔드 차트 유형 파라미터
const CHART_PERIOD_TO_TYPE: Record<ChartPeriod, ChartType> = {
  popular: 'RISING',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

// 인기 차트(실시간 급상승/주간/월간) — period가 바뀌면 queryKey가 달라져서 자동으로 다시 불러옴
export function usePopularityChart(period: ChartPeriod) {
  return useQuery({
    queryKey: ['playlist', 'chart', period],
    queryFn: () => getPopularityChartUseCase.execute({ type: CHART_PERIOD_TO_TYPE[period] }),
    staleTime: 0,
  });
}
