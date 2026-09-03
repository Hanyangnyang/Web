// 유스케이스: 내가 북마크한 곡 목록 조회 (새 백엔드, 북마크한 곡 화면)
import type { PlaylistSong } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, GetBookmarkedSongsParams } from '../repositories/IPlaylistRepository.js';

export interface GetBookmarkedSongsUseCase {
  execute: (params: GetBookmarkedSongsParams) => Promise<PlaylistSong[]>;
}

export const createGetBookmarkedSongsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetBookmarkedSongsUseCase => ({
  execute: (params) => playlistRepository.getBookmarkedSongs(params),
});
