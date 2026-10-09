// 훅(ViewModel): 인기 차트(실시간 급상승/주간/월간) — period가 바뀌면 queryKey가 달라져서 자동으로 다시 불러옴
import { useQuery } from '@tanstack/react-query';
import { getPopularityChartUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { CHART_QUERY_KEY } from './playlistQueryKeys.js';
import { type ChartPeriod } from '../../components/playlist/playlistTypes.js';
import type { ChartType } from '../../../domain/repositories/IPlaylistRepository.js';

// 홈 미리보기의 CHART_PERIOD_OPTIONS 키('실시간' 등) → 백엔드 차트 유형 파라미터
const CHART_PERIOD_TO_TYPE: Record<ChartPeriod, ChartType> = {
  popular: 'RISING',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

// 서버 스냅샷 갱신 주기(RISING 매시 40분, WEEKLY 매주 월요일, MONTHLY 매월 1일)에 맞춘 고정 staleTime —
// 타이머 폴링 없이 화면 진입/앱 복귀 시점에 이 시간이 지났을 때만 다시 받음.
// 실시간 급상승은 순위 갱신이 늦게 보이지 않도록 짧게(5분), 주간/월간은 하루에 몇 번 안 바뀌므로 길게(1시간)
const CHART_STALE_TIME: Record<ChartPeriod, number> = {
  popular: 5 * 60 * 1000,
  weekly: 60 * 60 * 1000,
  monthly: 60 * 60 * 1000,
};

export function usePopularityChart(period: ChartPeriod, isActive = true) {
  return useQuery({
    queryKey: [...CHART_QUERY_KEY, period],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      return getPopularityChartUseCase.execute({ type: CHART_PERIOD_TO_TYPE[period], deviceId });
    },
    staleTime: CHART_STALE_TIME[period],
    enabled: isActive,
  });
}
