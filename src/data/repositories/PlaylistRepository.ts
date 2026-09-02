// 레포지토리: 플레이리스트 피드 곡 목록 조회/등록/신고/좋아요/재생기록/이모지반응/곡별게시글모아보기/인기차트(새 백엔드)를 도메인 엔티티로 변환해 제공
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createPlaylistSong, type PlaylistSong, type PlaylistReaction } from '../../domain/entities/PlaylistSong.js';
import { createTrackPosts } from '../../domain/entities/TrackPosts.js';
import { createPopularityChart } from '../../domain/entities/PopularityChart.js';
import { createSongCreationStatus } from '../../domain/entities/SongCreationStatus.js';
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
  OTHER: '기타',
};

// 곡 등록 시 반대 방향 변환(라벨 → 백엔드 enum)에 씀
const GENRE_ENUM_BY_LABEL = Object.fromEntries(
  (Object.entries(GENRE_LABEL) as [PlaylistGenreDto, string][]).map(([genreEnum, label]) => [label, genreEnum])
) as Record<string, PlaylistGenreDto>;

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
    isBookmarked: d.isLiked,
    isMine: !!myDeviceId && d.deviceId === myDeviceId,
    reactions: toReactions(d.reactions),
    // 곡 등록(POST) 직후 응답엔 createdAt이 null로 내려옴(DB 기록 시점과 응답 시점이 안 맞는 것으로 보임) —
    // 방금 등록한 게시글이니 "지금"으로 채워도 실제 값과 사실상 같음
    createdAt: d.createdAt ?? new Date().toISOString(),
  });
}

export const createPlaylistRepository = (
  { playlistApiDataSource }: { playlistApiDataSource: PlaylistApiDataSource }
): PlaylistRepository => ({
  getRecentSongs: async (params) => {
    const res = await playlistApiDataSource.getSongs(params);

    if (!res.success)
      throw apiError(res.error?.message || `playlist songs API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !Array.isArray(res.data.content))
      throw apiError(`playlist songs API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    // 등록된 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return res.data.content.map((d) => toPlaylistSong(d, params?.deviceId));
  },

  getSongById: async (params) => {
    const res = await playlistApiDataSource.getSongById(params.songId, params.deviceId);

    if (!res.success)
      throw apiError(res.error?.message || `playlist song detail API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data?.id)
      throw apiError(`playlist song detail API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return toPlaylistSong(res.data, params.deviceId);
  },

  getBookmarkedSongs: async (params) => {
    const res = await playlistApiDataSource.getLikedSongs(params);

    if (!res.success)
      throw apiError(res.error?.message || `playlist liked songs API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !Array.isArray(res.data.content))
      throw apiError(`playlist liked songs API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    // 북마크한 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return res.data.content.map((d) => toPlaylistSong(d, params.deviceId));
  },

  getMySongs: async (params) => {
    const res = await playlistApiDataSource.getMySongs(params);

    if (!res.success)
      throw apiError(res.error?.message || `playlist my-songs API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !Array.isArray(res.data.content))
      throw apiError(`playlist my-songs API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    // 등록한 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return res.data.content.map((d) => toPlaylistSong(d, params.deviceId));
  },

  searchSongs: async (params) => {
    const res = await playlistApiDataSource.searchSongs(params);

    if (!res.success)
      throw apiError(res.error?.message || `playlist song search API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !Array.isArray(res.data.content))
      throw apiError(`playlist song search API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    // 검색 결과가 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return res.data.content.map((d) => toPlaylistSong(d, params.deviceId));
  },

  getSongCreationStatus: async (params) => {
    const res = await playlistApiDataSource.getCreationStatus(params.deviceId);

    if (!res.success)
      throw apiError(res.error?.message || `playlist creation-status API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data)
      throw apiError(`playlist creation-status API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return createSongCreationStatus(res.data);
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
    if (!res.success)
      throw apiError(res.error?.message || `playlist song submit API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data?.id)
      throw apiError(`playlist song submit API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return toPlaylistSong(res.data, params.deviceId);
  },

  reportSong: async (params) => {
    const res = await playlistApiDataSource.postReport(params.songId, {
      reporterDeviceId: params.deviceId,
      reason: params.reason,
    });

    if (!res.success)
      throw apiError(res.error?.message || `playlist song report API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });
  },

  toggleBookmark: async (params) => {
    const res = await playlistApiDataSource.postLike(params.songId, { deviceId: params.deviceId });

    if (!res.success)
      throw apiError(res.error?.message || `playlist song like API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || typeof res.data.isLiked !== 'boolean')
      throw apiError(`playlist song like API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return res.data.isLiked;
  },

  recordTrackPlay: async (trackId) => {
    const res = await playlistApiDataSource.postTrackPlay(trackId);

    if (!res.success)
      throw apiError(res.error?.message || `playlist track play API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });
  },

  toggleReaction: async (params) => {
    const res = await playlistApiDataSource.postReaction(params.songId, {
      deviceId: params.deviceId,
      reactionType: params.reactionType,
    });

    if (!res.success)
      throw apiError(res.error?.message || `playlist reaction API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !Array.isArray(res.data.reactions))
      throw apiError(`playlist reaction API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return toReactions(res.data.reactions);
  },

  getTrackPosts: async (params) => {
    const res = await playlistApiDataSource.getTrackPosts(params);

    if (!res.success)
      throw apiError(res.error?.message || `track posts API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !Array.isArray(res.data.songs?.content))
      throw apiError(`track posts API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return createTrackPosts({
      trackId: res.data.trackId,
      title: res.data.title,
      artist: res.data.artist,
      albumArtUrl: res.data.albumArtUrl,
      totalSongsCount: res.data.totalSongsCount,
      totalHeartCount: res.data.totalHeartCount,
      // 재생수는 게시글 단위가 아니라 트랙 단위라 모든 게시글에 같은 값이 실려있음 — 첫 게시글에서만 꺼내 씀
      totalPlayCount: res.data.songs.content[0]?.totalPlayCount ?? 0,
      posts: res.data.songs.content.map((d) => toPlaylistSong(d, params.deviceId)),
    });
  },

  getPopularityChart: async (params) => {
    const res = await playlistApiDataSource.getCharts(params?.type);

    if (!res.success)
      throw apiError(res.error?.message || `playlist charts API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    if (!res.data || !Array.isArray(res.data.tracks))
      throw apiError(`playlist charts API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return createPopularityChart({
      chartType: res.data.chartType,
      displayTitle: res.data.displayTitle,
      tracks: res.data.tracks,
    });
  },
});
