// 훅(ViewModel): 흡연 부스/구역 목록 조회
import { getSmokingSpotsUseCase } from '../../../di.js';
import type { SmokingSpot } from '../../../domain/entities/SmokingSpot.js';
import { createStaticDataQuery, type StaticDataQueryOptions } from '../createStaticDataQuery.js';

const useSmokingSpotsQuery = createStaticDataQuery<SmokingSpot>({
  queryKey: ['campus', 'smokingSpots'],
  fetcher: () => getSmokingSpotsUseCase.execute(),
  errorMessage: '흡연장 정보를 불러오지 못했습니다.',
});

export function useSmokingSpots(options?: StaticDataQueryOptions) {
  const { data, loading, loadErr } = useSmokingSpotsQuery(options);
  return { spots: data, loading, loadErr };
}
