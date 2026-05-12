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

export function useMenu() {
  const [menuDate, setMenuDate]     = useState(getInitialDate);
  const [cafes, setCafes]           = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const { markReady } = useBoot();
  const initialFetched = useRef(false);

  const fetchMenus = useCallback(async (targetDate) => {
    setMenuLoading(true);
    const dateStr = targetDate.toISOString().split('T')[0].replace(/-/g, '/');
    try {
      const result = await getMenuUseCase.execute(dateStr);
      setCafes(result);
      if (!initialFetched.current) {
        initialFetched.current = true;
        markReady('menu');
      }
    } catch (e) {
      console.error('식단 조회 실패:', e);
    } finally {
      setMenuLoading(false);
    }
  }, [markReady]);

  useEffect(() => {
    fetchMenus(menuDate);
  }, [menuDate, fetchMenus]);

  const changeDate = useCallback((offset) => {
    setMenuDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset);
      return d;
    });
  }, []);

  return { menuDate, cafes, menuLoading, changeDate };
}
