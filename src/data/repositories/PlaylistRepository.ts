// 레포지토리: 플레이리스트 피드 곡 목록 조회/등록/신고/좋아요/재생기록/이모지반응/곡별게시글모아보기/인기차트(새 백엔드)를 도메인 엔티티로 변환해 제공
import { apiError, type ApiResponse, type HttpError } from '../../infrastructure/http/HttpClient.js';
import { createPlaylistSong, type PlaylistSong, type PlaylistReaction } from '../../domain/entities/PlaylistSong.js';
import { createTrackPosts } from '../../domain/entities/TrackPosts.js';
import { createPopularityChart } from '../../domain/entities/PopularityChart.js';
import { createSongCreationStatus } from '../../domain/entities/SongCreationStatus.js';
import { createArtistRecommendation } from '../../domain/entities/ArtistRecommendation.js';
import { SongCreationStatusSchema } from '../schemas/SongCreationStatusSchema.js';
import { ArtistRecommendationsDataSchema, ArtistRecommendationItemSchema } from '../schemas/ArtistRecommendationSchema.js';
import { ChartDataSchema, ChartTrackDtoSchema } from '../schemas/ChartSchema.js';
import type { PlaylistApiDataSource, PlaylistSongDto, PlaylistGenreDto, PlaylistReactionDto } from '../datasources/PlaylistApiDataSource.js';
import type { PlaylistRepository } from '../../domain/repositories/IPlaylistRepository.js';

const AREA = '플레이리스트';

// 백엔드 genre enum → 화면에서 쓰는 장르 라벨(playlistTypes.ts의 GENRES.label과 동일한 표기)
const GENRE_LABEL: Record<PlaylistGenreDto, string> = {
  KPOP: 'K-POP',
  ROCK: '락',
  BAND: '밴드',
  R_AND_B: 'R&B',
  HIPHOP: '힙합',
  INDIE: '인디',
  BALLAD: '발라드',
  POP: 'POP',
  JPOP: 'J-POP',
  OST: 'OST',
  OTHER: '기타',
};

// 곡 등록 시 반대 방향 변환(라벨 → 백엔드 enum)에 씀
const GENRE_ENUM_BY_LABEL = Object.fromEntries(
  (Object.entries(GENRE_LABEL) as [PlaylistGenreDto, string][]).map(([genreEnum, label]) => [label, genreEnum])
) as Record<string, PlaylistGenreDto>;

// success 플래그와 data 형태를 함께 검증하는 공용 헬퍼 — 아래 각 메서드가 반복하던
// `if (!res.success) throw ...` / `if (!res.data...) throw ...` 페어를 하나로 모음.
// label만 API별로 다르게 넘기면 기존과 동일한 에러 메시지("{label} API returned ...")가 나옴
function unwrap<T>(res: ApiResponse<T>, label: string, isValid: (data: T) => boolean): T {
  if (!res.success)
    throw apiError(res.error?.message || `${label} API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

  if (!isValid(res.data))
    throw apiError(`${label} API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

  return res.data;
}

// data 형태 검증 없이 success만 확인하면 되는 메서드(신고 접수·재생 기록)용
function assertSuccess(res: ApiResponse<unknown>, label: string): void {
  if (!res.success)
    throw apiError(res.error?.message || `${label} API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });
}

function toReactions(dtos?: PlaylistReactionDto[]): PlaylistReaction[] {
  return (dtos ?? []).map((r) => ({ type: r.type, emoji: r.emoji, count: r.count, isReacted: r.isReacted }));
}

// myDeviceId: 이 요청을 보낸 기기 자신의 id — d.deviceId(게시글 등록자)와 비교해 isMine을 판단
function toPlaylistSong(d: PlaylistSongDto, myDeviceId?: string): PlaylistSong {
  return createPlaylistSong({
    id: d.id,
    trackId: d.trackId,
    title: d.title,
    artist: d.artist,
    albumArtUrl: d.albumArtUrl,
    comment: d.comment,
    genres: (d.genres ?? []).map((g) => GENRE_LABEL[g] ?? g),
    isLiked: d.isLiked,
    isMine: !!myDeviceId && d.deviceId === myDeviceId,
    reactions: toReactions(d.reactions),
    likeCount: d.likeCount,
    // 곡 등록(POST) 직후 응답엔 createdAt이 null로 내려옴(DB 기록 시점과 응답 시점이 안 맞는 것으로 보임) —
    // 방금 등록한 게시글이니 "지금"으로 채워도 실제 값과 사실상 같음
    createdAt: d.createdAt ?? new Date().toISOString(),
  });
}

export const createPlaylistRepository = (
  { playlistApiDataSource }: { playlistApiDataSource: PlaylistApiDataSource }
): PlaylistRepository => ({
  getRecentSongs: async (params) => {
    // 화면에서 쓰는 장르 라벨(예: 'R&B')로 들어오면 백엔드 enum(R_AND_B)으로 바꿔서 보냄
    const genre = params?.genre ? (GENRE_ENUM_BY_LABEL[params.genre] ?? params.genre) : undefined;
    const res = await playlistApiDataSource.getSongs({ ...params, genre });
    const data = unwrap(res, 'playlist songs', (d) => !!d && Array.isArray(d.content));

    // 등록된 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return { songs: data.content.map((d) => toPlaylistSong(d, params?.deviceId)), last: data.last };
  },

  getSongById: async (params) => {
    const res = await playlistApiDataSource.getSongById(params.songId, params.deviceId);
    const data = unwrap(res, 'playlist song detail', (d) => !!d?.id);

    return toPlaylistSong(data, params.deviceId);
  },

  getLikedSongs: async (params) => {
    const res = await playlistApiDataSource.getLikedSongs(params);
    const data = unwrap(res, 'playlist liked songs', (d) => !!d && Array.isArray(d.content));

    // 좋아요한 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return { songs: data.content.map((d) => toPlaylistSong(d, params.deviceId)), last: data.last };
  },

  getMySongs: async (params) => {
    const res = await playlistApiDataSource.getMySongs(params);
    const data = unwrap(res, 'playlist my-songs', (d) => !!d && Array.isArray(d.content));

    // 등록한 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return { songs: data.content.map((d) => toPlaylistSong(d, params.deviceId)), last: data.last };
  },

  searchSongs: async (params) => {
    const res = await playlistApiDataSource.searchSongs(params);
    const data = unwrap(res, 'playlist song search', (d) => !!d && Array.isArray(d.content));

    // 검색 결과가 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return data.content.map((d) => toPlaylistSong(d, params.deviceId));
  },

  getSongCreationStatus: async (params) => {
    const res = await playlistApiDataSource.getCreationStatus(params.deviceId);
    const data = unwrap(res, 'playlist creation-status', (d) => !!d);

    // canCreate 같은 핵심 필드가 없거나 타입이 틀리면 조용히 기본값으로 감추지 않고 에러로 던짐
    const parsed = SongCreationStatusSchema.safeParse(data);
    if (!parsed.success)
      throw apiError(
        `playlist creation-status API returned invalid shaped 'data': ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    return createSongCreationStatus(parsed.data);
  },

  submitSong: async (params) => {
    const genres = params.genres
      .map((label) => GENRE_ENUM_BY_LABEL[label])
      .filter((g): g is PlaylistGenreDto => Boolean(g));

    const res = await playlistApiDataSource.postSong({
      trackId: params.trackId,
      title: params.title,
      artist: params.artist,
      albumArtUrl: params.albumArtUrl,
      comment: params.comment,
      deviceId: params.deviceId,
      genres,
    });

    // 등록 제한(PL001/PL002)·AI 모더레이션(PL003)·입력값 검증(C001)·서버 오류(C004) 같은 비즈니스 에러는
    // HTTP 400/500으로 내려와서 datasource의 parseOrThrow가 이미 HttpError.code에 실어 던진 뒤라 여기까진 안 옴 —
    // 혹시 200과 함께 success:false로 내려오는 경우를 대비한 방어 코드
    const data = unwrap(res, 'playlist song submit', (d) => !!d?.id);

    return toPlaylistSong(data, params.deviceId);
  },

  reportSong: async (params) => {
    const res = await playlistApiDataSource.postReport(params.songId, {
      reporterDeviceId: params.deviceId,
      reason: params.reason,
    });

    assertSuccess(res, 'playlist song report');
  },

  toggleLike: async (params) => {
    const res = await playlistApiDataSource.postTrackLike(params.trackId, { deviceId: params.deviceId });
    const data = unwrap(res, 'playlist track like', (d) => !!d && typeof d.isLiked === 'boolean');

    return data.isLiked;
  },

  recordTrackPlay: async (params) => {
    const res = await playlistApiDataSource.postTrackPlay(params.trackId, { deviceId: params.deviceId });
    assertSuccess(res, 'playlist track play');
  },

  toggleReaction: async (params) => {
    const res = await playlistApiDataSource.postReaction(params.songId, {
      deviceId: params.deviceId,
      reactionType: params.reactionType,
    });
    const data = unwrap(res, 'playlist reaction', (d) => !!d && Array.isArray(d.reactions));

    return toReactions(data.reactions);
  },

  getTrackPosts: async (params) => {
    let res;
    try {
      res = await playlistApiDataSource.getTrackPosts(params);
    } catch (e) {
      // 404 + C003은 "이 곡에 달린 게시글이 0개"라는 뜻 — 에러가 아니라 정상적인 빈 결과로 바꿔서 돌려줌.
      // 에러로 던지면 react-query가 재시도(기본 3회)를 하고 최종 실패 시 Sentry에도 쌓이기 때문
      const err = e as HttpError;
      if (err?.statusCode === 404 && err.code === 'C003') {
        return createTrackPosts({
          trackId: params.trackId,
          title: '',
          artist: '',
          albumArtUrl: '',
          totalSongsCount: 0,
          likeCount: 0,
          totalPlayCount: 0,
          isLiked: false,
          posts: [],
          last: true,
        });
      }
      throw e;
    }
    const data = unwrap(res, 'track posts', (d) => !!d && Array.isArray(d.songs?.content));

    return createTrackPosts({
      trackId: data.trackId,
      title: data.title,
      artist: data.artist,
      albumArtUrl: data.albumArtUrl,
      totalSongsCount: data.totalSongsCount,
      likeCount: data.likeCount,
      // 재생수·좋아요 여부는 곡 단위라 최상위 필드를 씀 — 게시글이 0개여도 내려옴(구 응답 대비로 첫 게시글 값을 폴백)
      totalPlayCount: data.totalPlayCount ?? data.songs.content[0]?.totalPlayCount ?? 0,
      isLiked: data.isLiked ?? data.songs.content[0]?.isLiked ?? false,
      posts: data.songs.content.map((d) => toPlaylistSong(d, params.deviceId)),
      last: data.songs.last,
    });
  },

  getPopularityChart: async (params) => {
    const res = await playlistApiDataSource.getCharts(params?.type, params?.deviceId, params?.genre);
    const data = unwrap(res, 'playlist charts', (d) => !!d);
    const invalidShape = (detail: string) =>
      apiError(`playlist charts API returned invalid shaped 'data': ${detail}`, { area: AREA, endpoint: res._requestUrl });

    // 1. data 봉투가 구조적으로 잘못됐으면(tracks가 배열이 아님 등) 에러로 던짐
    const parsed = ChartDataSchema.safeParse(data);
    if (!parsed.success)
      throw invalidShape(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '));

    // 2. 곡 하나가 이상하면(rank/trackId 누락 등) 그 곡만 제외
    const tracks = parsed.data.tracks
      .map((t) => ChartTrackDtoSchema.safeParse(t))
      .filter((r) => r.success)
      .map((r) => r.data);

    // 3. 곡이 있었는데 하나도 못 살렸으면 "집계 안 됨"이 아니라 응답 형태가 바뀐 것이라 에러로 던짐
    if (parsed.data.tracks.length > 0 && tracks.length === 0) throw invalidShape('every track failed validation');

    return createPopularityChart({
      chartType: parsed.data.chartType,
      displayTitle: parsed.data.displayTitle,
      tracks,
    });
  },

  getArtistRecommendations: async (params) => {
    const res = await playlistApiDataSource.getRecommendations(params.deviceId);
    const data = unwrap(res, 'playlist recommendations', (d) => !!d);

    const parsed = ArtistRecommendationsDataSchema.safeParse(data);
    if (!parsed.success)
      throw apiError(
        `playlist recommendations API returned invalid shaped 'data': ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    // 카드 하나가 이상하면(artist/trackId 누락 등) 그 카드만 제외 — 서버가 준 순서는 그대로 유지.
    // 0개는 오류가 아니라 정상 결과(기록·주간차트가 모두 없는 경우)라 빈 배열 그대로 돌려줌
    return parsed.data.items
      .map((item) => ArtistRecommendationItemSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => createArtistRecommendation(r.data));
  },
});
