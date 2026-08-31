// 유스케이스: 음원 트랙(Spotify 곡) 검색 결과별 게시글수/북마크수 조회 (새 백엔드, 검색 결과 화면 상단 트랙 섹션용)
import type { TrackStats } from '../entities/TrackStats.js';
import type { PlaylistRepository, SearchTrackStatsParams } from '../repositories/IPlaylistRepository.js';

export interface SearchTrackStatsUseCase {
  execute: (params: SearchTrackStatsParams) => Promise<TrackStats[]>;
}

export const createSearchTrackStatsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): SearchTrackStatsUseCase => ({
  execute: (params) => playlistRepository.searchTrackStats(params),
});
