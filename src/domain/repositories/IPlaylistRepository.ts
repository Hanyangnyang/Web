// 도메인 레포지토리 인터페이스: 플레이리스트 피드 곡 목록 조회/등록/신고/좋아요(북마크)/재생기록/이모지반응 계약 (구현은 data 레이어의 PlaylistRepository)
import type { PlaylistSong, PlaylistReaction } from '../entities/PlaylistSong.js';

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

export interface PlaylistRepository {
  getRecentSongs: (params?: GetPlaylistSongsParams) => Promise<PlaylistSong[]>;
  submitSong: (params: SubmitSongParams) => Promise<PlaylistSong>;
  reportSong: (params: ReportSongParams) => Promise<void>;
  // 서버가 현재 상태를 보고 등록/취소를 알아서 판단(토글)하므로 원하는 목표값은 넘기지 않음 —
  // 결과로 내려온 실제 isLiked만 반환 (heartCount는 화면에 안 써서 버림)
  toggleBookmark: (params: ToggleBookmarkParams) => Promise<boolean>;
  // 재생 버튼을 누를 때마다 기록 — 어디서 눌렸든 결과를 화면에서 안 써서 반환값 없음
  recordTrackPlay: (trackId: string) => Promise<void>;
  // 서버가 토글 후 그 곡의 9종 반응 전체 최신 카운트를 내려줘서, 화면 상태를 통째로 그걸로 맞추면 됨
  toggleReaction: (params: ToggleReactionParams) => Promise<PlaylistReaction[]>;
}
