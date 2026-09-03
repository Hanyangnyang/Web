// 유스케이스: 특정 곡(trackId)에 달린 추천 게시글 모아보기 (새 백엔드, 곡 단위 게시글 목록 화면)
import type { TrackPosts } from '../entities/TrackPosts.js';
import type { PlaylistRepository, GetTrackPostsParams } from '../repositories/IPlaylistRepository.js';

export interface GetTrackPostsUseCase {
  execute: (params: GetTrackPostsParams) => Promise<TrackPosts>;
}

export const createGetTrackPostsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetTrackPostsUseCase => ({
  execute: (params) => playlistRepository.getTrackPosts(params),
});
