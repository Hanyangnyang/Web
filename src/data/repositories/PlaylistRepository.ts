// 레포지토리: 플레이리스트 피드 곡 목록 조회/등록/신고/좋아요/재생기록/이모지반응(새 백엔드)을 도메인 엔티티로 변환해 제공
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createPlaylistSong, type PlaylistSong, type PlaylistReaction } from '../../domain/entities/PlaylistSong.js';
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

function toPlaylistSong(d: PlaylistSongDto): PlaylistSong {
  return createPlaylistSong({
    id: d.id,
    trackId: d.trackId,
    title: d.title,
    artist: d.artist,
    albumArtUrl: d.albumArtUrl,
    comment: d.comment,
    genres: (d.genres ?? []).map((g) => GENRE_LABEL[g] ?? g),
    isBookmarked: d.isLiked,
    reactions: toReactions(d.reactions),
    createdAt: d.createdAt,
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
    return res.data.content.map(toPlaylistSong);
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

    return toPlaylistSong(res.data);
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
});
