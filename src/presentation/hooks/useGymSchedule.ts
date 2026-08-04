// 훅(ViewModel): 체대 헬스장 시간표 조회 (TanStack Query 기반)
import { useQuery } from '@tanstack/react-query';
import { getGymScheduleUseCase } from '../../di.js';
import type { GymSchedule } from '../../domain/entities/Gym.js';

const GYM_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간 — 학기 중 앱 재배포 전까지 안 바뀌는 정적 데이터
const GYM_QUERY_KEY = ['gym', 'schedule'];

export interface UseGymScheduleResult {
  gymData: GymSchedule | null;
  loading: boolean;
  loadErr: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useGymSchedule(): UseGymScheduleResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: GYM_QUERY_KEY,
    queryFn: () => getGymScheduleUseCase.execute(),
    staleTime: GYM_STALE_TIME,
  });

  return {
    gymData: data ?? null,
    loading: isLoading,
    loadErr: isError ? '짐 시간표를 불러오지 못했습니다.' : null,
  };
}
