import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getWeatherUseCase, getLibraryStatusUseCase } from '../../di.js';
import type { Weather } from '../../domain/entities/Weather.js';
import type { LibraryStatus } from '../../data/repositories/PortalRepository.js';

const CACHE_TTL = 900000; // 15분

const WEATHER_QUERY_KEY = ['portal', 'weather'];
const LIBRARY_QUERY_KEY = ['portal', 'library'];

// ─── 공개 Prefetch 함수 (App.jsx 에서 앱 시작 시 호출) ─────────────
// 캐시가 이미 신선하면(staleTime 이내) react-query가 알아서 네트워크 요청을 건너뜀
export function prefetchPortalData() {
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: WEATHER_QUERY_KEY, queryFn: () => getWeatherUseCase.execute(), staleTime: CACHE_TTL }),
    queryClient.prefetchQuery({ queryKey: LIBRARY_QUERY_KEY, queryFn: () => getLibraryStatusUseCase.execute(), staleTime: CACHE_TTL }),
  ]);
}

export interface UsePortalDataResult {
  weather: Weather | null;
  library: LibraryStatus | null;
  weatherLoading: boolean;
  libraryLoading: boolean;
  error: Error | null;
}

// ─── Hook ─────────────────────────────────────────────────────────
// weather/library를 독립된 쿼리로 분리 — 한쪽이 늦어도 다른 쪽 로딩이 먼저 풀린다.
// isVisible=false(비활성 탭)면 쿼리 자체를 멈춰서 안 보이는 탭 때문에 불필요한 요청이 나가지 않게 함.
export function usePortalData(isVisible = true): UsePortalDataResult {
  const weatherQuery = useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: () => getWeatherUseCase.execute(),
    staleTime: CACHE_TTL,
    enabled: isVisible,
  });

  const libraryQuery = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: () => getLibraryStatusUseCase.execute(),
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
