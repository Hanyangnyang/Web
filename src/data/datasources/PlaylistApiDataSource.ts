// 데이터 소스: 플레이리스트 피드 곡 목록 새 백엔드(/api/v1/playlist/songs) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 백엔드 genre enum — 'band'(밴드)에 대응하는 값은 아직 없음
export type PlaylistGenreDto = 'KPOP' | 'ROCK' | 'R_AND_B' | 'HIPHOP' | 'INDIE' | 'BALLAD' | 'POP' | 'JPOP' | 'OTHER';

export interface PlaylistReactionDto {
  type: string;
  emoji: string;
  count: number;
  isReacted: boolean;
}

export interface PlaylistSongDto {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: PlaylistGenreDto[];
  isLiked: boolean; // 서비스 내 명칭은 "북마크"지만 API 필드명은 isLiked
  reactions: PlaylistReactionDto[];
  createdAt: string; // ISO 8601
  // heartCount, totalPlayCount, deviceId, updatedAt도 응답에 있지만 화면에 표기하지 않아 그대로 버림
}

export interface PagedPlaylistSongsDto {
  content: PlaylistSongDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GetPlaylistSongsDataSourceParams {
  genre?: string;
  deviceId?: string;
  page?: number;
  size?: number;
}

export interface PlaylistApiDataSource {
  getSongs: (params?: GetPlaylistSongsDataSourceParams) => Promise<ApiResponse<PagedPlaylistSongsDto>>;
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 50;

export const createPlaylistApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PlaylistApiDataSource => ({
  getSongs: async (params = {}) => {
    const { genre, deviceId, page = DEFAULT_PAGE, size = DEFAULT_SIZE } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (genre) query.set('genre', genre);
    if (deviceId) query.set('deviceId', deviceId);

    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs?${query.toString()}`));
  },
});
