// 훅(ViewModel): 식단 날짜 탐색 및 식당별 메뉴 데이터 관리
import { useState, useEffect, useCallback, useRef } from 'react';
import { getMenuUseCase } from '../../di.js';
import { getKSTDate } from '../../utils/time.js';
import { useBoot } from '../context/BootContext';

function getInitialDate() {
  const dateParam = new URLSearchParams(window.location.search).get('date');
  if (dateParam) {
    const d = new Date(dateParam + 'T00:00:00Z');
    if (!isNaN(d)) return d;
  }
  return getKSTDate();
}

function performMenuCacheGC() {
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

export function useMenu() {
  const [menuDate, setMenuDate]     = useState(getInitialDate);
  const [cafes, setCafes]           = useState([]);
  const [cafesDate, setCafesDate]   = useState(null); // cafes가 어느 날짜 데이터인지 추적
  const [menuLoading, setMenuLoading] = useState(true);
  const { markReady } = useBoot();
  const initialFetched = useRef(false);
  const fetchCounterRef = useRef(0); // 가장 최근 페치만 반영하도록 경쟁 조건 방지

  const fetchMenus = useCallback(async (targetDate) => {
    const myCounter = ++fetchCounterRef.current;
    const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '/');
    const cafesDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `menu_${dateStr}`;
    let hasCache = false;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (myCounter === fetchCounterRef.current) {
          setCafes(parsed);
          setCafesDate(cafesDateStr);
          setMenuLoading(false);
        }
        hasCache = true;
        if (!initialFetched.current) {
          initialFetched.current = true;
          markReady('menu');
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
    if (!initialFetched.current) return;

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
  }, []);

  const changeDate = useCallback((offsetOrDate) => {
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
