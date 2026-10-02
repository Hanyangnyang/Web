// 유스케이스: 게시글(추천글) 단건 상세 조회 (새 백엔드, 게시글 상세 화면)
import type { PlaylistSong } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, GetSongByIdParams } from '../repositories/IPlaylistRepository.js';

export interface GetSongByIdUseCase {
  execute: (params: GetSongByIdParams) => Promise<PlaylistSong>;
}

export const createGetSongByIdUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetSongByIdUseCase => ({
  execute: (params) => playlistRepository.getSongById(params),
});
