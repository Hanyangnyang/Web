// 유스케이스: 곡 게시글 이모지 반응 토글 (새 백엔드, 이모지 버튼이 눌리는 곳 어디든)
import type { PlaylistReaction } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, ToggleReactionParams } from '../repositories/IPlaylistRepository.js';

export interface ToggleReactionUseCase {
  execute: (params: ToggleReactionParams) => Promise<PlaylistReaction[]>;
}

export const createToggleReactionUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): ToggleReactionUseCase => ({
  execute: (params) => playlistRepository.toggleReaction(params),
});
