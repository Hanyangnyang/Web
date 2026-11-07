// 훅(ViewModel): 학식 날짜 탐색 및 식당별 메뉴 데이터 관리 (TanStack Query 기반)
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMenuForPeriodUseCase } from '../../di.js';
import { getKSTDateUnsafe, toDateKey } from '../../utils/kstTime.js';
import { createEmptyCafes, type Cafe } from '../../domain/entities/Cafe.js';

// 10분 — 백엔드가 학식 홈페이지를 1시간마다 스크래핑하므로, 사용자가 보는 정보의 최대 지연은
// '백엔드 주기(≤60분) + 이 값'이다. 1시간이던 때는 최악 2시간 묵은 메뉴가 보일 수 있었다.
// 요청은 이 시간이 지난 뒤 '다시 볼 때'(학식 탭 진입·앱 복귀)만 나가서, 일 400명 규모에선 부담이 거의 없다
const MENU_STALE_TIME = 10 * 60 * 1000;
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

  // 앱 복귀 시 재검증 — 전역 refetchOnWindowFocus가 꺼져 있어서(queryClient.ts), 학식 탭에 둔 채
  // 백그라운드에 갔다가 돌아오면 몇 시간 전 메뉴가 그대로 보였다(다시 불러오는 건 탭을 옮길 때뿐).
  // 학식 탭이 보이는 중에 앱이 다시 화면에 나타나면, staleTime이 지난 경우에만(stale: true) 다시 받는다.
  // 전역 옵션을 켜면 다른 탭 요청까지 늘어나므로 학식에만 붙인다 (셔틀·공공버스와 같은 visibilitychange 방식)
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isActive) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void queryClient.refetchQueries({ queryKey: MENU_FOR_PERIOD_QUERY_KEY, stale: true, type: 'active' });
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, queryClient]);

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
