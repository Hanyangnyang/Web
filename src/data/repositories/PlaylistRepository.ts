// 레포지토리: 플레이리스트 피드 곡 목록(새 백엔드)을 도메인 엔티티로 변환해 제공
import { apiError } from '../../infrastructure/http/HttpClient.js';
import { createPlaylistSong, type PlaylistSong } from '../../domain/entities/PlaylistSong.js';
import type { PlaylistApiDataSource, PlaylistSongDto, PlaylistGenreDto } from '../datasources/PlaylistApiDataSource.js';
import type { PlaylistRepository } from '../../domain/repositories/IPlaylistRepository.js';

const AREA = '플레이리스트';

// 백엔드 genre enum → 화면에서 쓰는 장르 라벨(playlistTypes.ts의 GENRES.label과 동일한 표기)
const GENRE_LABEL: Record<PlaylistGenreDto, string> = {
  KPOP: 'K-POP',
  ROCK: '락',
  R_AND_B: 'R&B',
  HIPHOP: '힙합',
  INDIE: '인디',
  BALLAD: '발라드',
  POP: 'POP',
  JPOP: 'J-POP',
  OTHER: '기타',
};

function toPlaylistSongs(dtos: PlaylistSongDto[]): PlaylistSong[] {
  return dtos.map((d) => createPlaylistSong({
    id: d.id,
    trackId: d.trackId,
    title: d.title,
    artist: d.artist,
    albumArtUrl: d.albumArtUrl,
    comment: d.comment,
    genres: (d.genres ?? []).map((g) => GENRE_LABEL[g] ?? g),
    isBookmarked: d.isLiked,
    reactions: (d.reactions ?? []).map((r) => ({ type: r.type, emoji: r.emoji, count: r.count, isReacted: r.isReacted })),
    createdAt: new Date(d.createdAt),
  }));
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
    return toPlaylistSongs(res.data.content);
  },
});
