// 훅(ViewModel): 체대 헬스장 시간표 조회 (TanStack Query 기반)
import { useQuery } from '@tanstack/react-query';
import { getGymScheduleUseCase } from '../../di.js';
import type { GymSchedule } from '../../domain/entities/Gym.js';

const GYM_STALE_TIME = 60 * 60 * 1000; // 1시간 — 백엔드 gymPeriod 캐시 TTL(12시간)보다 짧게 재검증. 학기/셀 변경 시 백엔드가 즉시 evict하므로 대부분은 같은 캐시값을 그대로 돌려받음
const GYM_QUERY_KEY = ['gym', 'schedule'];

export interface UseGymScheduleResult {
  gymData: GymSchedule | null;
  loading: boolean;
  loadErr: string | null;
  refetch: () => void;
}

export function useGymSchedule(): UseGymScheduleResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: GYM_QUERY_KEY,
    queryFn: () => getGymScheduleUseCase.execute(),
    staleTime: GYM_STALE_TIME,
  });

  return {
    gymData: data ?? null,
    loading: isLoading,
    loadErr: isError ? '헬스장 시간표를 불러오지 못했습니다' : null,
    refetch: () => { refetch(); },
  };
}
