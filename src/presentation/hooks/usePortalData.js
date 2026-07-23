import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';

const CACHE_TTL = 900000; // 15분 — 기존 usePortalData.js의 CACHE_TTL과 동일한 의도 (staleTime으로 사용)

const WEATHER_QUERY_KEY = ['portal', 'weather'];
const LIBRARY_QUERY_KEY = ['portal', 'library'];

async function fetchWeather() {
  const res = await fetch('/api/portal?type=weather');
  if (!res.ok) throw new Error(`weather HTTP ${res.status}`);
  return res.json();
}

// ─── 도서관 데이터 fetch + 파싱 ───────────────────────────────────
async function fetchLibrary() {
  const res = await fetch('/api/portal?type=library');
  if (!res.ok) throw new Error(`library HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error('library API returned success:false');

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

// ─── 공개 Prefetch 함수 (App.jsx 에서 앱 시작 시 호출) ─────────────
// 캐시가 이미 신선하면(staleTime 이내) react-query가 알아서 네트워크 요청을 건너뜀
export function prefetchPortalData() {
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: WEATHER_QUERY_KEY, queryFn: fetchWeather, staleTime: CACHE_TTL }),
    queryClient.prefetchQuery({ queryKey: LIBRARY_QUERY_KEY, queryFn: fetchLibrary, staleTime: CACHE_TTL }),
  ]);
}

// ─── Hook ─────────────────────────────────────────────────────────
// weather/library를 독립된 쿼리로 분리 — 한쪽이 늦어도 다른 쪽 로딩이 먼저 풀린다.
// isVisible=false(비활성 탭)면 쿼리 자체를 멈춰서 안 보이는 탭 때문에 불필요한 요청이 나가지 않게 함.
export function usePortalData(isVisible = true) {
  const weatherQuery = useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: fetchWeather,
    staleTime: CACHE_TTL,
    enabled: isVisible,
  });

  const libraryQuery = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: fetchLibrary,
    staleTime: CACHE_TTL,
    enabled: isVisible,
  });

  return {
    weather: weatherQuery.data || null,
    library: libraryQuery.data || null,
    weatherLoading: weatherQuery.isLoading,
    libraryLoading: libraryQuery.isLoading,
    error: weatherQuery.error || libraryQuery.error || null,
  };
}
