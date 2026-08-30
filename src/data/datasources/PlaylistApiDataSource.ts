// 데이터 소스: 플레이리스트 피드 곡 목록 새 백엔드(/api/v1/playlist/songs) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 백엔드 genre enum
export type PlaylistGenreDto = 'KPOP' | 'ROCK' | 'BAND' | 'R_AND_B' | 'HIPHOP' | 'INDIE' | 'BALLAD' | 'POP' | 'JPOP' | 'OTHER';

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

// 곡 추천 및 등록 요청 바디. 등록자 IP는 클라이언트 헤더로 백엔드가 알아서 수집하므로 안 보냄.
// 실패 시 HTTP 400/500 + error.code로 내려오며(parseOrThrow가 HttpError.code에 그대로 실어줌), 코드별 의미:
//   PL001 (400) 1일 3곡 등록 제한(기기당 KST 당일 기준) 초과
//   PL002 (400) 동일 기기가 최근 7일 내 같은 trackId를 이미 추천함
//   PL003 (400) Gemini 모더레이션이 제목+아티스트+코멘트 결합 문맥에서 부적절한 표현 감지
//   C001  (400) 장르 0개/4개 이상 선택 또는 코멘트 200자 초과 등 입력값 검증 실패
//   C004  (500) DB 등 서버 내부 일시 장애 — 재시도 유도
export interface CreatePlaylistSongDto {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  deviceId: string;
  genres: PlaylistGenreDto[];
}

// 곡 신고하기 요청/응답 — 신고 접수 레코드 대부분(status, adminMemo, reviewedAt 등)은
// 화면에서 쓸 데가 없어 접수 성공 여부만 필요
export interface CreatePlaylistSongReportDto {
  reporterDeviceId: string;
  reason: string;
}

export interface PlaylistSongReportDto {
  id: string;
  songId: string;
  status: string;
}

export interface PlaylistApiDataSource {
  getSongs: (params?: GetPlaylistSongsDataSourceParams) => Promise<ApiResponse<PagedPlaylistSongsDto>>;
  postSong: (body: CreatePlaylistSongDto) => Promise<ApiResponse<PlaylistSongDto>>;
  postReport: (songId: string, body: CreatePlaylistSongReportDto) => Promise<ApiResponse<PlaylistSongReportDto>>;
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

  postSong: async (body) => parseOrThrow(await httpClient.post('/api/v1/playlist/songs', body)),

  postReport: async (songId, body) =>
    parseOrThrow(await httpClient.post(`/api/v1/playlist/songs/${songId}/reports`, body)),
});
