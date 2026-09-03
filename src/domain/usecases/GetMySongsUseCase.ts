// 유스케이스: 내가 등록(작성)한 추천글 목록 조회 (새 백엔드, 내가 등록한 곡 화면)
import type { PlaylistSong } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, GetMySongsParams } from '../repositories/IPlaylistRepository.js';

export interface GetMySongsUseCase {
  execute: (params: GetMySongsParams) => Promise<PlaylistSong[]>;
}

export const createGetMySongsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetMySongsUseCase => ({
  execute: (params) => playlistRepository.getMySongs(params),
});
