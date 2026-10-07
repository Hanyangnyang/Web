// 유스케이스: 내가 좋아요한 곡 목록 조회 (새 백엔드, 좋아요한 곡 화면)
import type { PlaylistSong } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, GetLikedSongsParams } from '../repositories/IPlaylistRepository.js';

export interface GetLikedSongsUseCase {
  execute: (params: GetLikedSongsParams) => Promise<PlaylistSong[]>;
}

export const createGetLikedSongsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetLikedSongsUseCase => ({
  execute: (params) => playlistRepository.getLikedSongs(params),
});
