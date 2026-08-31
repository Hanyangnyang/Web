// 도메인 레포지토리 인터페이스: 플레이리스트 피드 곡 목록 조회/등록/신고/좋아요(북마크)/재생기록/이모지반응/곡별게시글모아보기/인기차트 계약 (구현은 data 레이어의 PlaylistRepository)
import type { PlaylistSong, PlaylistReaction } from '../entities/PlaylistSong.js';
import type { TrackPosts } from '../entities/TrackPosts.js';
import type { PopularityChart } from '../entities/PopularityChart.js';
import type { SongCreationStatus } from '../entities/SongCreationStatus.js';

export interface GetPlaylistSongsParams {
  genre?: string;
  deviceId?: string;
  page?: number;
  size?: number;
}

export interface SubmitSongParams {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  deviceId: string;
  // 화면에서 쓰는 라벨 형태 그대로 (예: 'R&B', '인디') — 백엔드 enum 변환은 레포지토리가 담당
  genres: string[];
}

export interface ReportSongParams {
  songId: string;
  deviceId: string;
  reason: string;
}

export interface ToggleBookmarkParams {
  songId: string;
  deviceId: string;
}

export interface ToggleReactionParams {
  songId: string;
  deviceId: string;
  reactionType: string;
}

export interface GetTrackPostsParams {
  trackId: string;
  deviceId?: string;
  // 백엔드 정렬 파라미터 형식 그대로 (예: 'createdAt,desc', 'heartCount,desc')
  sort?: string;
  page?: number;
  size?: number;
}

export type ChartType = 'RISING' | 'WEEKLY' | 'MONTHLY';

export interface GetPopularityChartParams {
  type?: ChartType;
}

export interface GetSongByIdParams {
  songId: string;
  deviceId?: string;
}

export interface GetSongCreationStatusParams {
  deviceId: string;
}

export interface GetBookmarkedSongsParams {
  deviceId: string;
  page?: number;
  size?: number;
}

export interface SearchSongsParams {
  keyword: string;
  deviceId?: string;
  page?: number;
  size?: number;
}

export interface GetMySongsParams {
  deviceId: string;
  // 작성일시(createdAt) 기준 정렬 방향 — 기본값 DESC(최신순)
  direction?: 'ASC' | 'DESC';
  page?: number;
  size?: number;
}

export interface PlaylistRepository {
  getRecentSongs: (params?: GetPlaylistSongsParams) => Promise<PlaylistSong[]>;
  // 게시글 단건 상세 조회 — 딥링크/SNS 공유/알림 연동, 그리고 게시글 목록에서 상세화면 진입 시 사용
  getSongById: (params: GetSongByIdParams) => Promise<PlaylistSong>;
  // 곡 등록 화면 진입 시 1일 3곡 제한/최근 7일 중복 추천 사전 확인용 기기 상태 조회
  getSongCreationStatus: (params: GetSongCreationStatusParams) => Promise<SongCreationStatus>;
  // 내가 좋아요(=서비스 내 "북마크") 누른 곡 목록 조회 — 북마크한 곡 화면용
  getBookmarkedSongs: (params: GetBookmarkedSongsParams) => Promise<PlaylistSong[]>;
  // 내가 등록(작성)한 추천글 목록 조회 — 내가 등록한 곡 화면용
  getMySongs: (params: GetMySongsParams) => Promise<PlaylistSong[]>;
  // 추천글 가중치 통합 검색(제목/가수/코멘트) — 검색 결과 화면의 "게시글" 섹션용
  searchSongs: (params: SearchSongsParams) => Promise<PlaylistSong[]>;
  submitSong: (params: SubmitSongParams) => Promise<PlaylistSong>;
  reportSong: (params: ReportSongParams) => Promise<void>;
  // 서버가 현재 상태를 보고 등록/취소를 알아서 판단(토글)하므로 원하는 목표값은 넘기지 않음 —
  // 결과로 내려온 실제 isLiked만 반환 (heartCount는 화면에 안 써서 버림)
  toggleBookmark: (params: ToggleBookmarkParams) => Promise<boolean>;
  // 재생 버튼을 누를 때마다 기록 — 어디서 눌렸든 결과를 화면에서 안 써서 반환값 없음
  recordTrackPlay: (trackId: string) => Promise<void>;
  // 서버가 토글 후 그 곡의 9종 반응 전체 최신 카운트를 내려줘서, 화면 상태를 통째로 그걸로 맞추면 됨
  toggleReaction: (params: ToggleReactionParams) => Promise<PlaylistReaction[]>;
  // 특정 곡(trackId)에 달린 추천 게시글 모아보기 — 곡 단위 게시글 목록 화면(TrackPostsView)용
  getTrackPosts: (params: GetTrackPostsParams) => Promise<TrackPosts>;
  // 인기 차트(실시간 급상승/주간/월간) 조회
  getPopularityChart: (params?: GetPopularityChartParams) => Promise<PopularityChart>;
}
