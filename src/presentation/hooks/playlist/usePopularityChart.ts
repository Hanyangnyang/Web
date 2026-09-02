// 훅(ViewModel): 인기 차트(실시간 급상승/주간/월간) — period가 바뀌면 queryKey가 달라져서 자동으로 다시 불러옴
import { useQuery } from '@tanstack/react-query';
import { getPopularityChartUseCase } from '../../../di.js';
import { type ChartPeriod } from '../../components/playlist/playlistTypes.js';
import type { ChartType } from '../../../domain/repositories/IPlaylistRepository.js';

// 홈 미리보기의 CHART_PERIOD_OPTIONS 키('실시간' 등) → 백엔드 차트 유형 파라미터
const CHART_PERIOD_TO_TYPE: Record<ChartPeriod, ChartType> = {
  popular: 'RISING',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

export function usePopularityChart(period: ChartPeriod) {
  return useQuery({
    queryKey: ['playlist', 'chart', period],
    queryFn: () => getPopularityChartUseCase.execute({ type: CHART_PERIOD_TO_TYPE[period] }),
    staleTime: 0,
  });
}
