// 훅(ViewModel): 캠퍼스 건물 목록 조회
import { getCampusBuildingsUseCase } from '../../../di.js';
import { visibleBuildings, type CampusBuilding, type PlottableBuilding } from '../../../domain/entities/CampusBuilding.js';
import { createStaticDataQuery, type StaticDataQueryOptions } from '../createStaticDataQuery.js';

const useCampusBuildingsQuery = createStaticDataQuery<CampusBuilding, PlottableBuilding>({
  queryKey: ['campus', 'buildings'],
  fetcher: () => getCampusBuildingsUseCase.execute(),
  errorMessage: '건물 정보를 불러오지 못했습니다.',
  select: visibleBuildings,
});

export function useCampusBuildings(options?: StaticDataQueryOptions) {
  const { data, loading, loadErr } = useCampusBuildingsQuery(options);
  return { buildings: data, loading, loadErr };
}
