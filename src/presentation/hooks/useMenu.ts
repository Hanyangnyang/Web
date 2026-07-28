// 훅(ViewModel): 식단 날짜 탐색 및 식당별 메뉴 데이터 관리
import { useState, useEffect, useCallback, useRef } from 'react';
import { getMenuUseCase } from '../../di.js';
import { getKSTDate } from '../../utils/time.js';
import { useBoot } from '../context/BootContext';
import type { Cafe } from '../../domain/entities/Cafe.js';

function getInitialDate(): Date {
  const dateParam = new URLSearchParams(window.location.search).get('date');
  if (dateParam) {
    const d = new Date(dateParam + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  return getKSTDate();
}

function performMenuCacheGC(): void {
  try {
    const todayKST = getKSTDate();
    const limitDate = new Date(todayKST);
    limitDate.setDate(limitDate.getDate() - 7);
    const limitDateStr = limitDate.toISOString().split('T')[0].replace(/-/g, '/');

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('menu_')) {
        const keyDateStr = key.replace('menu_', '');
        if (keyDateStr < limitDateStr) {
          localStorage.removeItem(key);
          i--;
        }
      }
    }
  } catch (e) {
    console.error('Menu cache GC failed:', e);
  }
}

export interface UseMenuResult {
  menuDate: Date;
  cafes: Cafe[];
  cafesDate: string | null;
  menuLoading: boolean;
  changeDate: (offsetOrDate: number | Date) => void;
}

// BootContext.jsx가 아직 JS라 useBoot()의 반환 타입을 추론할 수 없어 여기서만 임시로 명시
// (BootContext를 TS로 옮기면 이 타입은 그쪽 export로 대체)
export function useMenu(): UseMenuResult {
  const [menuDate, setMenuDate]     = useState<Date>(getInitialDate);
  const [cafes, setCafes]           = useState<Cafe[]>([]);
  const [cafesDate, setCafesDate]   = useState<string | null>(null); // cafes가 어느 날짜 데이터인지 추적
  const [menuLoading, setMenuLoading] = useState(true);
  const { markReady } = useBoot() as { markReady: (key: string) => void };
  const initialFetched = useRef(false); // markReady 중복 호출 방지 (훅 생애주기 중 최초 1회만)
  const [menuReady, setMenuReady] = useState(false); // prefetch effect가 구독하는 신호 — ref는 값이 바뀌어도 effect를 재실행 못 시키므로 state로 전달
  const fetchCounterRef = useRef(0); // 가장 최근 페치만 반영하도록 경쟁 조건 방지

  const fetchMenus = useCallback(async (targetDate: Date) => {
    const myCounter = ++fetchCounterRef.current;
    const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '/');
    const cafesDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `menu_${dateStr}`;
    let hasCache = false;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed: Cafe[] = JSON.parse(cached);
        if (myCounter === fetchCounterRef.current) {
          setCafes(parsed);
          setCafesDate(cafesDateStr);
          setMenuLoading(false);
        }
        hasCache = true;
        if (!initialFetched.current) {
          initialFetched.current = true;
          markReady('menu');
          setMenuReady(true);
        }
      }
    } catch (e) {
      console.error('Failed to parse cached menu:', e);
    }

    if (!hasCache && myCounter === fetchCounterRef.current) {
      setMenuLoading(true);
    }

    try {
      const result = await getMenuUseCase.execute(dateStr);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.error('Failed to write menu cache:', e);
      }
      if (!initialFetched.current) {
        initialFetched.current = true;
        markReady('menu');
        setMenuReady(true);
      }
      if (myCounter === fetchCounterRef.current) {
        setCafes(result);
        setCafesDate(cafesDateStr);
      }
    } catch (e) {
      console.error('식단 조회 실패:', e);
    } finally {
      if (myCounter === fetchCounterRef.current) {
        setMenuLoading(false);
      }
    }
  }, [markReady]);

  useEffect(() => {
    performMenuCacheGC();
  }, []);

  useEffect(() => {
    fetchMenus(menuDate);
  }, [menuDate, fetchMenus]);

  useEffect(() => {
    if (!menuReady) return;

    const prefetchAdjacentDays = async () => {
      const today = getKSTDate();
      const offsets = [-1, 1, 2, 3, 4, 5, 6, 7];

      for (const offset of offsets) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + offset);
        const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '/');
        const cacheKey = `menu_${dateStr}`;

        if (localStorage.getItem(cacheKey)) {
          continue;
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          const result = await getMenuUseCase.execute(dateStr);
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (e) {
          console.warn(`Failed to prefetch menu for ${dateStr}:`, e);
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
  }, [menuReady]);

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

  return { menuDate, cafes, cafesDate, menuLoading, changeDate };
}
