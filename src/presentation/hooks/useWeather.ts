import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getWeatherUseCase } from '../../di.js';
import type { Weather } from '../../domain/entities/Weather.js';

const CACHE_TTL = 900000; // 15분

// 쿼리 키는 usePortalData 시절 그대로 둔다 —
// 바꾸면 사용자 기기에 영속화된 캐시가 통째로 무효화돼 업데이트 직후 첫 실행이 느려진다.
const WEATHER_QUERY_KEY = ['portal', 'weather'];

// ─── 공개 Prefetch 함수 (App.tsx 에서 앱 시작 시 호출) ─────────────
export function prefetchWeather() {
  return queryClient.prefetchQuery({ queryKey: WEATHER_QUERY_KEY, queryFn: () => getWeatherUseCase.execute(), staleTime: CACHE_TTL });
}

export interface UseWeatherResult {
  weather: Weather | null;
  loading: boolean;
  error: Error | null;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useWeather(isVisible = true): UseWeatherResult {
  const { data, isLoading, error } = useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: () => getWeatherUseCase.execute(),
    staleTime: CACHE_TTL,
    enabled: isVisible,
  });

  return {
    weather: data ?? null,
    loading: isLoading,
    error,
  };
}
