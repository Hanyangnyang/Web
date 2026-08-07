// 훅(ViewModel): 흡연 부스/구역 목록 조회 (TanStack Query 기반)
import { useQuery } from '@tanstack/react-query';
import { getSmokingSpotsUseCase } from '../../di.js';
import type { SmokingSpot } from '../../domain/entities/SmokingSpot.js';

const SMOKING_SPOT_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간 — 정적 데이터라 자주 안 바뀜
const SMOKING_SPOT_QUERY_KEY = ['campus', 'smokingSpots'];

export interface UseSmokingSpotsOptions {
  enabled?: boolean; // 흡연장 레이어를 켰을 때만 불러오도록 지연 로딩
}

export interface UseSmokingSpotsResult {
  spots: SmokingSpot[];
  loading: boolean;
  loadErr: string | null;
}

export function useSmokingSpots({ enabled = true }: UseSmokingSpotsOptions = {}): UseSmokingSpotsResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: SMOKING_SPOT_QUERY_KEY,
    queryFn: () => getSmokingSpotsUseCase.execute(),
    staleTime: SMOKING_SPOT_STALE_TIME,
    enabled,
  });

  return {
    spots: data ?? [],
    loading: isLoading,
    loadErr: isError ? '흡연장 정보를 불러오지 못했습니다.' : null,
  };
}
