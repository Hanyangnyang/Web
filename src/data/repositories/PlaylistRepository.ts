// 레포지토리: 플레이리스트 피드 곡 목록 조회/등록/신고/좋아요/재생기록/이모지반응/곡별게시글모아보기/인기차트(새 백엔드)를 도메인 엔티티로 변환해 제공
import { apiError, type ApiResponse } from '../../infrastructure/http/HttpClient.js';
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
    const data = unwrap(res, 'playlist songs', (d) => !!d && Array.isArray(d.content));

    // 등록된 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return data.content.map((d) => toPlaylistSong(d, params?.deviceId));
  },

  getSongById: async (params) => {
    const res = await playlistApiDataSource.getSongById(params.songId, params.deviceId);
    const data = unwrap(res, 'playlist song detail', (d) => !!d?.id);

    return toPlaylistSong(data, params.deviceId);
  },

  getBookmarkedSongs: async (params) => {
    const res = await playlistApiDataSource.getLikedSongs(params);
    const data = unwrap(res, 'playlist liked songs', (d) => !!d && Array.isArray(d.content));

    // 북마크한 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return data.content.map((d) => toPlaylistSong(d, params.deviceId));
  },

  getMySongs: async (params) => {
    const res = await playlistApiDataSource.getMySongs(params);
    const data = unwrap(res, 'playlist my-songs', (d) => !!d && Array.isArray(d.content));

    // 등록한 곡이 아직 없을 수 있는 정상 케이스라 빈 배열은 에러로 취급하지 않음
    return data.content.map((d) => toPlaylistSong(d, params.deviceId));
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

    return createSongCreationStatus(data);
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

  toggleBookmark: async (params) => {
    const res = await playlistApiDataSource.postLike(params.songId, { deviceId: params.deviceId });
    const data = unwrap(res, 'playlist song like', (d) => !!d && typeof d.isLiked === 'boolean');

    return data.isLiked;
  },

  recordTrackPlay: async (trackId) => {
    const res = await playlistApiDataSource.postTrackPlay(trackId);
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
    const res = await playlistApiDataSource.getTrackPosts(params);
    const data = unwrap(res, 'track posts', (d) => !!d && Array.isArray(d.songs?.content));

    return createTrackPosts({
      trackId: data.trackId,
      title: data.title,
      artist: data.artist,
      albumArtUrl: data.albumArtUrl,
      totalSongsCount: data.totalSongsCount,
      totalHeartCount: data.totalHeartCount,
      // 재생수는 게시글 단위가 아니라 트랙 단위라 모든 게시글에 같은 값이 실려있음 — 첫 게시글에서만 꺼내 씀
      totalPlayCount: data.songs.content[0]?.totalPlayCount ?? 0,
      posts: data.songs.content.map((d) => toPlaylistSong(d, params.deviceId)),
    });
  },

  getPopularityChart: async (params) => {
    const res = await playlistApiDataSource.getCharts(params?.type);
    const data = unwrap(res, 'playlist charts', (d) => !!d && Array.isArray(d.tracks));

    return createPopularityChart({
      chartType: data.chartType,
      displayTitle: data.displayTitle,
      tracks: data.tracks,
    });
  },
});
