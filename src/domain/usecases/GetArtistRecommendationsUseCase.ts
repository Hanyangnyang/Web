// 유스케이스: 소식탭 플레이리스트 배너용 가수·대표곡 추천 카드 조회 (새 백엔드)
import type { ArtistRecommendation } from '../entities/ArtistRecommendation.js';
import type { PlaylistRepository, GetArtistRecommendationsParams } from '../repositories/IPlaylistRepository.js';

export interface GetArtistRecommendationsUseCase {
  execute: (params: GetArtistRecommendationsParams) => Promise<ArtistRecommendation[]>;
}

export const createGetArtistRecommendationsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetArtistRecommendationsUseCase => ({
  execute: (params) => playlistRepository.getArtistRecommendations(params),
});
