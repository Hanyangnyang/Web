// 유스케이스: 인기 차트(실시간 급상승/주간/월간) 조회 (새 백엔드, 인기차트 화면)
import type { PopularityChart } from '../entities/PopularityChart.js';
import type { PlaylistRepository, GetPopularityChartParams } from '../repositories/IPlaylistRepository.js';

export interface GetPopularityChartUseCase {
  execute: (params?: GetPopularityChartParams) => Promise<PopularityChart>;
}

export const createGetPopularityChartUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetPopularityChartUseCase => ({
  execute: (params) => playlistRepository.getPopularityChart(params),
});
