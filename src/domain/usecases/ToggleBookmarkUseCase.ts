// 유스케이스: 곡 좋아요(북마크) 토글 (새 백엔드, 게시글 카드 북마크 배지)
import type { PlaylistRepository, ToggleBookmarkParams } from '../repositories/IPlaylistRepository.js';

export interface ToggleBookmarkUseCase {
  execute: (params: ToggleBookmarkParams) => Promise<boolean>;
}

export const createToggleBookmarkUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): ToggleBookmarkUseCase => ({
  execute: (params) => playlistRepository.toggleBookmark(params),
});
