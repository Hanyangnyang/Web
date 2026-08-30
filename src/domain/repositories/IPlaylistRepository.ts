// 도메인 레포지토리 인터페이스: 플레이리스트 피드 곡 목록 제공 계약 (구현은 data 레이어의 PlaylistRepository)
import type { PlaylistSong } from '../entities/PlaylistSong.js';

export interface GetPlaylistSongsParams {
  genre?: string;
  deviceId?: string;
  page?: number;
  size?: number;
}

export interface PlaylistRepository {
  getRecentSongs: (params?: GetPlaylistSongsParams) => Promise<PlaylistSong[]>;
}
