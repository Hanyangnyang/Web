// 유스케이스: 곡 좋아요 토글 (새 백엔드, 게시글 카드 좋아요 배지)
import type { PlaylistRepository, ToggleLikeParams } from '../repositories/IPlaylistRepository.js';

export interface ToggleLikeUseCase {
  execute: (params: ToggleLikeParams) => Promise<boolean>;
}

export const createToggleLikeUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): ToggleLikeUseCase => ({
  execute: (params) => playlistRepository.toggleLike(params),
});
