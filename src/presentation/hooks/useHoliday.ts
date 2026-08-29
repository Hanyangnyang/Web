import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getIsHolidayUseCase } from '../../di.js';

const HOLIDAY_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간 — 백엔드 캐시 TTL과 무관하게, 오늘의 공휴일 여부는 날짜가 바뀌기 전까진 안 바뀌므로 캘린더 하루 단위로 잡음
const HOLIDAY_QUERY_KEY = ['holiday', 'today'];

export function prefetchIsHoliday() {
  return queryClient.prefetchQuery({
    queryKey: HOLIDAY_QUERY_KEY,
    queryFn: () => getIsHolidayUseCase.execute(),
    staleTime: HOLIDAY_STALE_TIME,
  });
}

export interface UseHolidayResult {
  isHoliday: boolean | null;
  isLoading: boolean;
}

// 오늘이 법정공휴일인지 — 셔틀버스와 지하철 dayType 판정 둘 다 이 값을 씀(새 백엔드가 이 값을 직접 안 내려줘서 별도 조회)
export function useHoliday(): UseHolidayResult {
  const { data, isLoading } = useQuery({
    queryKey: HOLIDAY_QUERY_KEY,
    queryFn: () => getIsHolidayUseCase.execute(),
    staleTime: HOLIDAY_STALE_TIME,
  });

  return {
    isHoliday: data ?? null,
    isLoading,
  };
}
