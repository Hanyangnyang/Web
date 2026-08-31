// 훅(ViewModel): 학식 날짜 탐색 및 식당별 메뉴 데이터 관리 (TanStack Query 기반)
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getMenuForDateUseCase, getMenuForPeriodUseCase } from '../../di.js';
import { getKSTDateUnsafe, toDateKey } from '../../utils/kstTime.js';
import type { Cafe } from '../../domain/entities/Cafe.js';

const MENU_STALE_TIME = 12 * 60 * 60 * 1000;  // 12시간 — 백엔드 Menu 캐시 TTL과 동일 (매일 오전 1시 스크래핑 시 evict)
const MENU_FOR_PERIOD_QUERY_KEY = ['menu-period'] as const;

function getInitialDate(): Date {
  const dateParam = new URLSearchParams(window.location.search).get('date');
  if (dateParam) {
    const d = new Date(dateParam + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  return getKSTDateUnsafe();
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
  refetchMenu: () => void;
}

export function useMenu(isActive = true): UseMenuResult {
  const [menuDate, setMenuDate] = useState<Date>(getInitialDate);

  const periodQuery = useQuery({
    queryKey: MENU_FOR_PERIOD_QUERY_KEY,
    queryFn: async () => {
      const menusByDate = await getMenuForPeriodUseCase.execute();
      for (const [dateStr, cafes] of Object.entries(menusByDate)) {
        queryClient.setQueryData(['menu', dateStr], cafes);
      }
      return true;
    },
    staleTime: MENU_STALE_TIME,
    enabled: isActive,
  });

  const hasCachedMenu = queryClient.getQueryData(menuQueryKey(menuDate)) !== undefined;
  const query = useQuery({
    queryKey: menuQueryKey(menuDate),
    queryFn: () => getMenuForDateUseCase.execute(menuDate),
    staleTime: MENU_STALE_TIME,
    enabled: hasCachedMenu || periodQuery.isFetched,
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
    menuLoading: !periodQuery.isFetched && !hasCachedMenu ? true : query.isLoading,
    menuRevalidating: query.isFetching && !query.isLoading,
    changeDate,
    refetchMenu: () => { query.refetch(); },
  };
}
