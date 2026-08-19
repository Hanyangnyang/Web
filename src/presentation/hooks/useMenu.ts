// 훅(ViewModel): 학식 날짜 탐색 및 식당별 메뉴 데이터 관리 (TanStack Query 기반)
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getMenuForDateUseCase, getMenuForPeriodUseCase } from '../../di.js';
import { getKSTDate, toDateKey } from '../../utils/time.js';
import type { Cafe } from '../../domain/entities/Cafe.js';

const MENU_STALE_TIME = 60 * 60 * 1000;  // 1시간 — 학식은 하루 단위로만 갱신되므로 진입마다 재검증할 필요 없음
const MENU_BATCH_QUERY_KEY = ['menu-batch'] as const;

function getInitialDate(): Date {
  const dateParam = new URLSearchParams(window.location.search).get('date');
  if (dateParam) {
    const d = new Date(dateParam + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  return getKSTDate();
}

function menuQueryKey(date: Date) {
  return ['menu', toDateKey(date)] as const;
}

export interface UseMenuResult {
  menuDate: Date;
  cafes: Cafe[];
  menuLoading: boolean;
  menuRevalidating: boolean; 
  changeDate: (offsetOrDate: number | Date) => void;
}

export function useMenu(): UseMenuResult {
  const [menuDate, setMenuDate] = useState<Date>(getInitialDate);

  const batchQuery = useQuery({
    queryKey: MENU_BATCH_QUERY_KEY,
    queryFn: async () => {
      const batch = await getMenuForPeriodUseCase.execute();
      for (const [dateStr, cafes] of Object.entries(batch)) {
        queryClient.setQueryData(['menu', dateStr], cafes);
      }
      return true;
    },
    staleTime: MENU_STALE_TIME,
  });

  const hasCachedMenu = queryClient.getQueryData(menuQueryKey(menuDate)) !== undefined;
  const query = useQuery({
    queryKey: menuQueryKey(menuDate),
    queryFn: () => getMenuForDateUseCase.execute(menuDate),
    staleTime: MENU_STALE_TIME,
    enabled: hasCachedMenu || batchQuery.isFetched,
  });

  const changeDate = useCallback((offsetOrDate: number | Date) => {
    if (offsetOrDate instanceof Date) {
      setMenuDate(new Date(offsetOrDate));
    } else {
      setMenuDate(prev => {
        const d = new Date(prev);
        d.setDate(d.getDate() + offsetOrDate);
        return d;
      });
    }
  }, []);

  return {
    menuDate,
    cafes: query.data ?? [],
    menuLoading: !batchQuery.isFetched && !hasCachedMenu ? true : query.isLoading,
    menuRevalidating: query.isFetching && !query.isLoading,
    changeDate,
  };
}
