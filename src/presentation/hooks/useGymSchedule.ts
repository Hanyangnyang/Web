// 훅(ViewModel): 체대 헬스장 시간표 조회 (TanStack Query 기반)
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getGymScheduleUseCase } from '../../di.js';
import { getKSTDateKey } from '../../utils/kstTime.js';
import type { GymSchedule } from '../../domain/entities/Gym.js';

const GYM_STALE_TIME = 60 * 60 * 1000; // 1시간 — 백엔드 gymPeriod 캐시 TTL(12시간)보다 짧게 재검증. 학기/셀 변경 시 백엔드가 즉시 evict하므로 대부분은 같은 캐시값을 그대로 돌려받음
const GYM_QUERY_KEY = ['gym', 'schedule'];
const DAY_CHANGE_CHECK_INTERVAL = 60 * 1000; // 1분마다 KST 날짜(자정 기준)가 바뀌었는지 확인

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

  // 헬스장은 셔틀과 달리 academic/status를 안 쓰고 GymPeriod.startDate/endDate로 직접 오늘 날짜와
  // 비교해서 기간을 고른다 — 그래서 "기간이 바뀌는 순간"이 아니라 "KST 날짜(자정)가 바뀌는 순간"을
  // 직접 감지해서 강제로 다시 받아온다. staleTime(1시간)만 믿으면 학기 시작일 직전에 관리자가 올린
  // 새 기간 내용을 자정 넘어서도 못 받아올 수 있음
  useEffect(() => {
    let lastDateKey = getKSTDateKey();
    const id = setInterval(() => {
      const today = getKSTDateKey();
      if (today !== lastDateKey) {
        lastDateKey = today;
        queryClient.invalidateQueries({ queryKey: GYM_QUERY_KEY });
      }
    }, DAY_CHANGE_CHECK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return {
    gymData: data ?? null,
    loading: isLoading,
    loadErr: isError ? '헬스장 시간표를 불러오지 못했습니다' : null,
    refetch: () => { refetch(); },
  };
}
