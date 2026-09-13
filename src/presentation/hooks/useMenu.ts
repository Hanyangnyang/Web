// 훅(ViewModel): 학식 날짜 탐색 및 식당별 메뉴 데이터 관리 (TanStack Query 기반)
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMenuForPeriodUseCase } from '../../di.js';
import { getKSTDateUnsafe, toDateKey } from '../../utils/kstTime.js';
import { createEmptyCafes, type Cafe } from '../../domain/entities/Cafe.js';

const MENU_STALE_TIME = 60 * 60 * 1000;  // 1시간 — 백엔드 Menu 캐시 TTL(12시간)보다 짧게 재검증. 대부분은 백엔드도 같은 캐시값을 그대로 돌려줌
const MENU_FOR_PERIOD_QUERY_KEY = ['menu-period'] as const;

function getInitialDate(): Date {
  const dateParam = new URLSearchParams(window.location.search).get('date');
  if (dateParam) {
    const d = new Date(dateParam + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  return getKSTDateUnsafe();
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
    queryFn: () => getMenuForPeriodUseCase.execute(),
    staleTime: MENU_STALE_TIME,
    enabled: isActive,
  });

  // 배치 응답에 이 날짜 키가 없으면 그날 등록된 메뉴가 없다는 뜻(백엔드가 그렇게 응답하기로 확인됨) —
  // 예전엔 이 경우 날짜별 API를 따로 호출했는데, 결과가 항상 "메뉴 없음"으로 정해져 있어 헛수고라 없앰
  const cafes = periodQuery.data?.[toDateKey(menuDate)] ?? createEmptyCafes();

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
    cafes,
    menuLoading: periodQuery.isLoading,
    menuRevalidating: periodQuery.isFetching && !periodQuery.isLoading,
    changeDate,
    refetchMenu: () => { periodQuery.refetch(); },
  };
}
