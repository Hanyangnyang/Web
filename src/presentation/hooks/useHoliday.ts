import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getDateInfoUseCase } from '../../di.js';

const HOLIDAY_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간 — 백엔드 캐시 TTL과 무관하게, 오늘의 공휴일 여부는 날짜가 바뀌기 전까진 안 바뀌므로 캘린더 하루 단위로 잡음
// useDateInfo.ts와 동일한 키 규칙('date-info', date ?? 'today') — 같은 날짜 조회는 캐시를 공유
const HOLIDAY_QUERY_KEY = ['date-info', 'today'];

const selectIsHoliday = (dateInfo: { dayType: string }) => dateInfo.dayType === 'HOLIDAY';

export function prefetchIsHoliday() {
  return queryClient.prefetchQuery({
    queryKey: HOLIDAY_QUERY_KEY,
    queryFn: () => getDateInfoUseCase.execute(),
    staleTime: HOLIDAY_STALE_TIME,
  });
}

export interface UseHolidayResult {
  isHoliday: boolean | null;
  isLoading: boolean;
}

// 오늘이 법정공휴일인지 — 셔틀버스와 지하철 dayType 판정 둘 다 이 값을 씀(새 백엔드가 이 값을 직접 안 내려줘서 별도 조회)
// dayType이 'WEEKEND'/'NO_OPERATION'인 경우는 여기서 holiday로 취급하지 않음 — 주말은 로컬 요일 계산이 이미 처리하고,
// NO_OPERATION(학교 자체 휴무 등)은 dayType()이 모르는 별개 개념이라 잘못 섞으면 평일이 주말로 둔갑함
export function useHoliday(): UseHolidayResult {
  const { data, isLoading } = useQuery({
    queryKey: HOLIDAY_QUERY_KEY,
    queryFn: () => getDateInfoUseCase.execute(),
    staleTime: HOLIDAY_STALE_TIME,
    select: selectIsHoliday,
  });

  return {
    isHoliday: data ?? null,
    isLoading,
  };
}
