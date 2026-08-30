// 도메인 레포지토리 인터페이스: 플레이리스트 피드 곡 목록 조회/등록 계약 (구현은 data 레이어의 PlaylistRepository)
import type { PlaylistSong } from '../entities/PlaylistSong.js';

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

export interface PlaylistRepository {
  getRecentSongs: (params?: GetPlaylistSongsParams) => Promise<PlaylistSong[]>;
  submitSong: (params: SubmitSongParams) => Promise<PlaylistSong>;
}
