// 훅(ViewModel): 학식 날짜 탐색 및 식당별 메뉴 데이터 관리 (TanStack Query 기반)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getMenuUseCase } from '../../di.js';
import { getKSTDate } from '../../utils/time.js';
import type { Cafe } from '../../domain/entities/Cafe.js';

const MENU_STALE_TIME = 60 * 60 * 1000; // 1시간 — 학식은 하루 단위로만 갱신되므로 진입마다 재검증할 필요 없음
const PREFETCH_GAP = 500; // 학교 서버(스크래핑 대상)에 짧은 시간에 요청이 몰리지 않도록 인접 날짜 prefetch 사이에 두는 텀(ms)

function getInitialDate(): Date {
  const dateParam = new URLSearchParams(window.location.search).get('date');
  if (dateParam) {
    const d = new Date(dateParam + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  return getKSTDate();
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '/');
}

function menuQueryKey(dateStr: string) {
  return ['menu', dateStr] as const;
}

function prefetchMenu(dateStr: string) {
  return queryClient.prefetchQuery({
    queryKey: menuQueryKey(dateStr),
    queryFn: () => getMenuUseCase.execute(dateStr),
    staleTime: MENU_STALE_TIME,
  });
}

export interface UseMenuResult {
  menuDate: Date;
  cafes: Cafe[];
  menuLoading: boolean; // 이 날짜 데이터가 하나도 없어 전체 스피너를 보여줘야 함
  menuRevalidating: boolean; // 이미 보여줄 데이터는 있고, 백그라운드로 재검증 중
  changeDate: (offsetOrDate: number | Date) => void;
}

export function useMenu(): UseMenuResult {
  const [menuDate, setMenuDate] = useState<Date>(getInitialDate);
  const dateStr = toDateStr(menuDate);

  const query = useQuery({
    queryKey: menuQueryKey(dateStr),
    queryFn: () => getMenuUseCase.execute(dateStr),
    staleTime: MENU_STALE_TIME,
  });

  // 최초 1회, 학식 데이터가 (캐시든 네트워크든) 준비되면 인접 날짜 prefetch 시작
  const firstLoadHandled = useRef(false);
  const [prefetchReady, setPrefetchReady] = useState(false);
  useEffect(() => {
    if (query.isSuccess && !firstLoadHandled.current) {
      firstLoadHandled.current = true;
      setPrefetchReady(true);
    }
  }, [query.isSuccess]);

  // 인접 날짜(어제 ~ +7일) 백그라운드 prefetch — 최초 로딩이 끝난 뒤 한 번만 실행
  useEffect(() => {
    if (!prefetchReady) return;

    const prefetchAdjacentDays = async () => {
      const today = getKSTDate();
      const offsets = [-1, 1, 2, 3, 4, 5, 6, 7];

      for (const offset of offsets) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + offset);
        const targetDateStr = toDateStr(targetDate);

        if (queryClient.getQueryData(menuQueryKey(targetDateStr))) {
          continue;
        }

        await new Promise(resolve => setTimeout(resolve, PREFETCH_GAP));

        try {
          await prefetchMenu(targetDateStr);
        } catch (e) {
          console.warn(`Failed to prefetch menu for ${targetDateStr}:`, e);
        }
      }
    };

    const timer = setTimeout(() => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
          prefetchAdjacentDays();
        });
      } else {
        prefetchAdjacentDays();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [prefetchReady]);

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
    menuLoading: query.isLoading,
    menuRevalidating: query.isFetching && !query.isLoading,
    changeDate,
  };
}
