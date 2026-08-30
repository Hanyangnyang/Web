// 유스케이스: 플레이리스트 피드 곡 목록 조회 (새 백엔드, 최근추가된곡 화면)
import type { PlaylistSong } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, GetPlaylistSongsParams } from '../repositories/IPlaylistRepository.js';

export interface GetRecentSongsUseCase {
  execute: (params?: GetPlaylistSongsParams) => Promise<PlaylistSong[]>;
}

export const createGetRecentSongsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetRecentSongsUseCase => ({
  execute: (params) => playlistRepository.getRecentSongs(params),
});
