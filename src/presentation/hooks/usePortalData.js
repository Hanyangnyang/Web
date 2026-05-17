import { useState, useEffect } from 'react';

// ─── 모듈 레벨 공유 상태 ───────────────────────────────────────────
// 컴포넌트가 언마운트/리마운트 되어도 데이터가 유지됨
let memoryCache = null;
let isFetching = false;   // 중복 fetch 방지 플래그
let listeners = [];       // 데이터 갱신 시 구독 컴포넌트에 알림

let retryCount = 0;       // 지수 백오프 재시도 횟수
let retryTimer = null;    // 재시도 타이머 레퍼런스
const MAX_RETRIES = 5;    // 최대 재시도 횟수 제한
const BASE_RETRY_DELAY = 3000; // 기본 백오프 딜레이 3초

const CACHE_KEY = 'hyu_portal_cache_v3';
const CACHE_TTL = 10800000; // 3시간 (서버 s-maxage 와 동일)

function notifyListeners(data) {
  listeners.forEach(fn => fn(data));
}

// ─── 공개 Prefetch 함수 (App.jsx 에서 앱 시작 시 호출) ─────────────
export async function prefetchPortalData() {
  // 유효한 메모리 캐시가 있으면 즉시 반환 (fetch 없음)
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
    retryCount = 0; // 캐시가 유효하면 재시도 횟수 리셋
    return;
  }
  // 이미 진행 중이면 중복 실행 방지
  if (isFetching) return;

  isFetching = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  try {
    const [weatherData, libData] = await Promise.all([
      fetch('/api/portal?type=weather').then(r => r.ok ? r.json() : null).catch(() => null),
      getLibraryData()
    ]);

    if (weatherData && libData) {
      const newData = {
        weather: weatherData,
        library: libData,
        timestamp: Date.now()
      };
      memoryCache = newData;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(newData)); } catch (_) {}
      notifyListeners(newData);
      retryCount = 0;
    } else if (weatherData || libData) {
      // 부분 성공 시: 기존 캐시와 병합하여 최선의 폴백 노출, 타임스탬프 갱신을 연기하여 백그라운드 재시도 유도
      const newData = {
        weather: weatherData || memoryCache?.weather || null,
        library: libData     || memoryCache?.library || null,
        timestamp: memoryCache?.timestamp || (Date.now() - CACHE_TTL + 30000) // 30초 후 즉시 갱신되도록 세팅
      };
      memoryCache = newData;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(newData)); } catch (_) {}
      notifyListeners(newData);
      triggerBackoffRetry();
    } else {
      triggerBackoffRetry();
    }
  } catch (e) {
    console.warn('[Portal] prefetch failed:', e);
    triggerBackoffRetry();
  } finally {
    isFetching = false;
  }
}

// 지수 백오프 재시도 트리거 함수
function triggerBackoffRetry() {
  if (retryCount >= MAX_RETRIES) {
    console.warn(`[Portal] Max retries (${MAX_RETRIES}) reached. Stopping background retry.`);
    return;
  }

  const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
  console.info(`[Portal] Fetch failed. Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);

  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryCount++;
    prefetchPortalData();
  }, delay);
}

// ─── Hook ─────────────────────────────────────────────────────────
export function usePortalData() {
  // 초기값: 1순위 메모리 캐시 → 2순위 localStorage 캐시 → null
  const [data, setData] = useState(() => {
    if (memoryCache) return memoryCache;
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          memoryCache = parsed; // 메모리에도 올려둠
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  });

  // 캐시가 있으면 로딩 스피너 없이 즉시 렌더링
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    // prefetch 완료 시 이 컴포넌트도 갱신받도록 구독
    const handler = (newData) => {
      setData(newData);
      setLoading(false);
    };
    listeners.push(handler);

    // 유효 캐시가 없거나, 캐시 내부 데이터 중 일부가 누락된 불완전 캐시인 경우 강제 즉시 갱신!
    const isPartialCache = memoryCache && (!memoryCache.weather || !memoryCache.library);

    if (!memoryCache || isPartialCache || Date.now() - memoryCache.timestamp >= CACHE_TTL) {
      setLoading(true);
      prefetchPortalData();
    }

    return () => {
      listeners = listeners.filter(fn => fn !== handler);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    weather: data?.weather || null,
    library: data?.library || null,
    loading,
    error: null
  };
}

// ─── 도서관 데이터 fetch + 파싱 ───────────────────────────────────
async function getLibraryData() {
  try {
    const res = await fetch('/api/portal?type=library');
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = await res.json();

    if (json.success) {
      const list = json.data.list.map(room => {
        const total    = room.seats.total;
        const occupied = room.seats.occupied;
        const ratio    = occupied / total;

        let status = '쾌적';
        let color  = '#2563eb';
        let emoji  = '🔵';

        if (ratio > 0.67) {
          status = '매우 혼잡'; color = '#991b1b'; emoji = '😫';
        } else if (ratio > 0.5) {
          status = '혼잡';     color = '#ef4444'; emoji = '🔴';
        } else if (ratio > 0.33) {
          status = '보통';     color = '#22c55e'; emoji = '🟢';
        }

        return { id: room.id, name: room.name, total, occupied, ratio, status, color, emoji };
      });

      const sortOrder = [61, 63, 132, 131];
      list.sort((a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id));
      return { list, updatedAt: Date.now() };
    }
    return null;
  } catch (e) {
    console.warn('[Portal] Library fetch failed:', e);
    return null;
  }
}
