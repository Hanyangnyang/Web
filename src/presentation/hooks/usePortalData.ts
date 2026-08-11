import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getWeatherUseCase, getLibraryStatusUseCase } from '../../di.js';
import type { Weather } from '../../domain/entities/Weather.js';
import type { LibraryStatus } from '../../domain/repositories/ILibraryRepository.js';

const CACHE_TTL = 900000; // 15분

const WEATHER_QUERY_KEY = ['portal', 'weather'];
const LIBRARY_QUERY_KEY = ['portal', 'library'];

// ─── 공개 Prefetch 함수 (App.jsx 에서 앱 시작 시 호출) ─────────────
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
