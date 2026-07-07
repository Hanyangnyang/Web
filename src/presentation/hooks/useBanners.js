import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';

// ─── 모듈 레벨 공유 상태 ───────────────────────────────────────────
// 컴포넌트가 언마운트/리마운트 되어도 배너 데이터가 유지됨
let memoryCache = null;   // { banners, timestamp }
let isFetching = false;   // 중복 fetch 방지 플래그
let listeners = [];       // 데이터 갱신 시 구독 컴포넌트에 알림

const CACHE_KEY = 'hyu_banners_cache_v1';
const CACHE_TTL = 86400000; // 24시간 (배너는 거의 바뀌지 않아 하루 주기)

function notifyListeners(data) {
  listeners.forEach(fn => fn(data));
}

// ─── 공개 Prefetch 함수 (App.jsx 에서 앱 시작 시 호출) ─────────────
export async function prefetchBanners() {
  // 유효한 메모리 캐시가 있으면 네트워크 요청 생략
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) return;
  // 이미 진행 중이면 중복 실행 방지
  if (isFetching) return;

  isFetching = true;
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (data && !error) {
      const newData = { banners: data, timestamp: Date.now() };
      memoryCache = newData;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(newData)); } catch { /* ignore */ }
      notifyListeners(newData);
    }
  } catch (err) {
    console.warn('[Banners] prefetch failed:', err);
  } finally {
    isFetching = false;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useBanners(isVisible = true) {
  // 초기값: 1순위 메모리 캐시 → 2순위 localStorage 캐시 → null
  const [data, setData] = useState(() => {
    if (memoryCache) return memoryCache;
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        memoryCache = parsed; // 메모리에도 올려둠
        return parsed;
      }
    } catch { /* ignore */ }
    return null;
  });

  // 캐시가 있으면 스켈레톤 없이 즉시 렌더링
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    // prefetch/갱신 완료 시 이 컴포넌트도 갱신받도록 구독
    const handler = (newData) => {
      setData(newData);
      setLoading(false);
    };
    listeners.push(handler);

    // 캐시가 없거나 TTL 만료 시 갱신 (stale-while-revalidate)
    //  - 캐시 없음  → 스켈레톤 노출 + fetch
    //  - 캐시 있음(만료) → 화면엔 캐시 유지, 백그라운드에서 조용히 갱신
    const isStale = !memoryCache || Date.now() - memoryCache.timestamp >= CACHE_TTL;
    if (isStale && isVisible) {
      if (!memoryCache) setLoading(true);
      prefetchBanners();
    }

    return () => {
      listeners = listeners.filter(fn => fn !== handler);
    };
  }, [isVisible]);

  return {
    banners: data?.banners || [],
    loading,
  };
}
