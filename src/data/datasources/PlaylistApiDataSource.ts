// 데이터 소스: 플레이리스트 피드 곡 목록 새 백엔드(/api/v1/playlist/songs) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 백엔드 genre enum
export type PlaylistGenreDto = 'KPOP' | 'ROCK' | 'BAND' | 'R_AND_B' | 'HIPHOP' | 'INDIE' | 'BALLAD' | 'POP' | 'JPOP' | 'OST' | 'OTHER';

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
  isLiked: boolean;
  reactions: PlaylistReactionDto[];
  createdAt: string | null; // ISO 8601 — 곡 등록(POST) 직후 응답엔 null로 내려옴
  // 이 곡을 추천 등록한 기기 — 화면에 직접 표기하진 않지만, 요청 기기의 deviceId와 비교해서
  // "내가 등록한 게시글인지"(isMine)를 판단하는 데 씀 (신고 아이콘 노출 여부 결정)
  deviceId: string;
  // 이 게시글이 속한 곡(trackId) 전체의 누적 재생수 — 재생 기록 API가 게시글이 아니라
  // 트랙 단위(POST /tracks/{trackId}/play)라, 같은 곡의 모든 게시글에 동일한 값이 실려옴
  totalPlayCount: number;
  // heartCount, updatedAt도 응답에 있지만 화면에 표기하지 않아 그대로 버림
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

// 곡 좋아요 토글 응답 — 곡(trackId) 단위라 같은 곡의 모든 게시글에 공통 적용되고,
// 서버가 현재 상태 보고 등록/취소를 알아서 판단.
// 동시성 제어·원자적 카운트 증감은 서버가 보장하므로 클라이언트는 그냥 호출만 하면 됨
export interface ToggleLikeDto {
  isLiked: boolean;
  heartCount: number; // 화면에 표기 안 해서 레포지토리에서 버림
}

// 이모지 반응 토글 응답 — 좋아요와 마찬가지로 서버가 현재 상태 보고 등록/취소를 판단.
// reactions에 그 곡의 9종 반응 전체 최신 카운트가 함께 내려와서, 화면 상태를 통째로 이걸로 맞추면 됨
export interface ToggleReactionDto {
  songId: string;
  reactionType: string;
  isReacted: boolean;
  reactions: PlaylistReactionDto[];
}

// 특정 곡(trackId)에 달린 추천 게시글 모아보기 응답
export interface TrackPostsDto {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  totalSongsCount: number;
  // 이 곡에 달린 모든 추천 게시글의 좋아요 수 합계
  totalHeartCount: number;
  songs: PagedPlaylistSongsDto;
}

export interface GetTrackPostsDataSourceParams {
  trackId: string;
  deviceId?: string;
  sort?: string;
  page?: number;
  size?: number;
}

// 백엔드 차트 유형 — RISING(실시간 급상승, 기본값), WEEKLY(주간), MONTHLY(월간)
export type ChartTypeDto = 'RISING' | 'WEEKLY' | 'MONTHLY';

// 인기차트 응답 shape 검증과 타입은 ChartSchema.ts(zod)가 담당하고 Repository가 파싱함 — 검증 전이라 unknown
// (snapshotTime, startPeriod, endPeriod도 응답에 있지만 displayTitle이 이미 사람이 읽기 좋은 형태라 화면에선 안 씀)
export type ChartDto = unknown;

// 곡 등록 화면 진입 시 사전 확인 응답 — 오늘 남은 등록 가능 횟수, 최근 7일 내 이미 추천한 곡 목록, 임시 차단 상태.
// 응답 shape 검증과 타입은 SongCreationStatusSchema.ts(zod)가 담당하고 Repository가 파싱함 — 검증 전이라 unknown
export type SongCreationStatusDto = unknown;

// 소식탭 가수·대표곡 추천 응답 — shape 검증과 타입은 ArtistRecommendationSchema.ts(zod)가 담당하고 Repository가 파싱함 — 검증 전이라 unknown
export type ArtistRecommendationsDto = unknown;

export interface GetLikedSongsDataSourceParams {
  deviceId: string;
  page?: number;
  size?: number;
}

export interface SearchSongsDataSourceParams {
  keyword: string;
  deviceId?: string;
  page?: number;
  size?: number;
}

export interface GetMySongsDataSourceParams {
  deviceId: string;
  direction?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

export interface PlaylistApiDataSource {
  getSongs: (params?: GetPlaylistSongsDataSourceParams) => Promise<ApiResponse<PagedPlaylistSongsDto>>;
  // 게시글 단건 상세 조회 — 응답 형태가 PlaylistSongDto와 동일(+heartCount/totalPlayCount/updatedAt, 화면에 안 써서 버림)
  getSongById: (songId: string, deviceId?: string) => Promise<ApiResponse<PlaylistSongDto>>;
  getCreationStatus: (deviceId: string) => Promise<ApiResponse<SongCreationStatusDto>>;
  // 내가 좋아요 누른 곡 목록 — 응답 형태는 getSongs와 동일한 페이지네이션 구조
  getLikedSongs: (params: GetLikedSongsDataSourceParams) => Promise<ApiResponse<PagedPlaylistSongsDto>>;
  // 내가 등록한 게시글 목록 — 응답 형태는 getSongs와 동일한 페이지네이션 구조
  getMySongs: (params: GetMySongsDataSourceParams) => Promise<ApiResponse<PagedPlaylistSongsDto>>;
  // 게시글 가중치 통합 검색(제목/가수/코멘트) — 응답 형태는 getSongs와 동일한 페이지네이션 구조
  searchSongs: (params: SearchSongsDataSourceParams) => Promise<ApiResponse<PagedPlaylistSongsDto>>;
  postSong: (body: CreatePlaylistSongDto) => Promise<ApiResponse<PlaylistSongDto>>;
  postReport: (songId: string, body: CreatePlaylistSongReportDto) => Promise<ApiResponse<PlaylistSongReportDto>>;
  // 곡(trackId) 단위 좋아요 토글 — 같은 곡의 모든 게시글에 공통 적용
  postTrackLike: (trackId: string, body: { deviceId: string }) => Promise<ApiResponse<ToggleLikeDto>>;
  // 재생 버튼을 누를 때마다 호출 — 인기차트 집계용 일자별 재생수 +1. 성공 응답은 data=null(Swagger 예시의 {}는 자동 생성값)이라 성공 여부만 확인.
  // DB에 없는 트랙(아직 추천 등록 안 된 검색 결과 곡 등)이면 404 C003
  postTrackPlay: (trackId: string) => Promise<ApiResponse<null>>;
  postReaction: (songId: string, body: { deviceId: string; reactionType: string }) => Promise<ApiResponse<ToggleReactionDto>>;
  getTrackPosts: (params: GetTrackPostsDataSourceParams) => Promise<ApiResponse<TrackPostsDto>>;
  getCharts: (type?: ChartTypeDto, deviceId?: string) => Promise<ApiResponse<ChartDto>>;
  // 기기별 가수·대표곡 추천 카드 최대 5개(서버가 기기별 5분 캐시) — deviceId 누락/UUID 형식 오류는 400
  getRecommendations: (deviceId: string) => Promise<ApiResponse<ArtistRecommendationsDto>>;
}

const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 50;
// 게시글 검색은 API 문서 기본값(size=20)을 그대로 따름 — 다른 목록보다 짧게
const SEARCH_DEFAULT_SIZE = 20;
// 내가 작성한 추천글 조회도 API 문서 기본값(size=20, 허용 범위 1~100)을 따름. page < 0 또는 size 범위 위반 시 서버가 400을 반환
const MY_SONGS_DEFAULT_SIZE = 20;

export const createPlaylistApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PlaylistApiDataSource => ({
  getSongs: async (params = {}) => {
    const { genre, deviceId, page = DEFAULT_PAGE, size = DEFAULT_SIZE } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (genre) query.set('genre', genre);
    if (deviceId) query.set('deviceId', deviceId);

    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs?${query.toString()}`));
  },

  getSongById: async (songId, deviceId) => {
    const query = deviceId ? `?deviceId=${deviceId}` : '';
    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs/${songId}${query}`));
  },

  getCreationStatus: async (deviceId) =>
    parseOrThrow(await httpClient.get(`/api/v1/playlist/songs/creation-status?deviceId=${deviceId}`)),

  getLikedSongs: async (params) => {
    const { deviceId, page = DEFAULT_PAGE, size = DEFAULT_SIZE } = params;
    const query = new URLSearchParams({ deviceId, page: String(page), size: String(size) });

    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs/tracks/liked?${query.toString()}`));
  },

  getMySongs: async (params) => {
    const { deviceId, direction = 'DESC', page = DEFAULT_PAGE, size = MY_SONGS_DEFAULT_SIZE } = params;
    const query = new URLSearchParams({ deviceId, page: String(page), size: String(size), direction });

    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs/my-songs?${query.toString()}`));
  },

  searchSongs: async (params) => {
    const { keyword, deviceId, page = DEFAULT_PAGE, size = SEARCH_DEFAULT_SIZE } = params;
    const query = new URLSearchParams({ keyword, page: String(page), size: String(size) });
    if (deviceId) query.set('deviceId', deviceId);

    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs/search?${query.toString()}`));
  },

  postSong: async (body) => parseOrThrow(await httpClient.post('/api/v1/playlist/songs', body)),

  postReport: async (songId, body) =>
    parseOrThrow(await httpClient.post(`/api/v1/playlist/songs/${songId}/reports`, body)),

  postTrackLike: async (trackId, body) =>
    parseOrThrow(await httpClient.post(`/api/v1/playlist/songs/tracks/${trackId}/like`, body)),

  postTrackPlay: async (trackId) =>
    parseOrThrow(await httpClient.post(`/api/v1/playlist/songs/tracks/${trackId}/play`, {})),

  postReaction: async (songId, body) =>
    parseOrThrow(await httpClient.post(`/api/v1/playlist/songs/${songId}/reactions`, body)),

  getTrackPosts: async (params) => {
    const { trackId, deviceId, sort, page = DEFAULT_PAGE, size = DEFAULT_SIZE } = params;
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (deviceId) query.set('deviceId', deviceId);
    if (sort) query.set('sort', sort);

    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs/tracks/${trackId}?${query.toString()}`));
  },

  getCharts: async (type, deviceId) => {
    const query = new URLSearchParams();
    if (type) query.set('type', type);
    if (deviceId) query.set('deviceId', deviceId);
    const queryString = query.toString();
    return parseOrThrow(await httpClient.get(`/api/v1/playlist/songs/charts${queryString ? `?${queryString}` : ''}`));
  },

  getRecommendations: async (deviceId) =>
    parseOrThrow(await httpClient.get(`/api/v1/playlist/recommendations?${new URLSearchParams({ deviceId }).toString()}`)),
});
