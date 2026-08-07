// 훅(ViewModel): 캠퍼스 건물 목록 조회 (TanStack Query 기반)
import { useQuery } from '@tanstack/react-query';
import { getCampusBuildingsUseCase } from '../../di.js';
import { visibleBuildings, type CampusBuilding } from '../../domain/entities/CampusBuilding.js';

const CAMPUS_BUILDING_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간 — 정적 데이터라 자주 안 바뀜
const CAMPUS_BUILDING_QUERY_KEY = ['campus', 'buildings'];

export interface UseCampusBuildingsOptions {
  enabled?: boolean; // 건물 레이어를 켰을 때만 불러오도록 지연 로딩
}

export interface UseCampusBuildingsResult {
  buildings: CampusBuilding[];
  loading: boolean;
  loadErr: string | null;
}

export function useCampusBuildings({ enabled = true }: UseCampusBuildingsOptions = {}): UseCampusBuildingsResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: CAMPUS_BUILDING_QUERY_KEY,
    queryFn: () => getCampusBuildingsUseCase.execute(),
    staleTime: CAMPUS_BUILDING_STALE_TIME,
    enabled,
  });

  return {
    buildings: data ? visibleBuildings(data) : [],
    loading: isLoading,
    loadErr: isError ? '건물 정보를 불러오지 못했습니다.' : null,
  };
}
