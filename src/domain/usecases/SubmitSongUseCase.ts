// 유스케이스: 플레이리스트 곡 추천/등록 (새 백엔드, 곡추천하기 화면)
import type { PlaylistSong } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, SubmitSongParams } from '../repositories/IPlaylistRepository.js';

export interface SubmitSongUseCase {
  execute: (params: SubmitSongParams) => Promise<PlaylistSong>;
}

export const createSubmitSongUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): SubmitSongUseCase => ({
  execute: (params) => playlistRepository.submitSong(params),
});
