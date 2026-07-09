import { useState, useEffect } from 'react';

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
  // 이미 진행 중이면 중복 실행 방지
  if (isFetching) return;

  isFetching = true;
  try {
    // 캐시 유무와 무관하게 항상 갱신 — /api/banners 는 Vercel CDN 캐시(s-maxage)라
    // 비용이 낮고, 앱 실행마다 재검증해서 새 배너가 다음 실행 때 바로 반영됨
    const res = await fetch('/api/banners');
    const json = await res.json();
    if (!res.ok || !Array.isArray(json.banners)) throw new Error(`HTTP ${res.status}`);

    const newData = { banners: json.banners, timestamp: Date.now() };
    memoryCache = newData;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(newData)); } catch { /* ignore */ }
    notifyListeners(newData);
  } catch (err) {
    console.warn('[Banners] prefetch failed:', err);
    // 실패 시에도 통지해서 스켈레톤이 무한 노출되지 않도록 함
    // 캐시가 있으면 화면 유지, 없으면 빈 목록(timestamp 0 → 다음 탭 방문 때 재시도)
    notifyListeners(memoryCache ?? { banners: [], timestamp: 0 });
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
