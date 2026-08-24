import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getWeatherUseCase } from '../../di.js';
import type { Weather } from '../../domain/entities/Weather.js';

const WEATHER_STALE_TIME = 600000; // 10분 (백엔드 weatherSummary 캐시 TTL과 일치)
const WEATHER_QUERY_KEY = ['portal', 'weather'];

export function prefetchWeather() {
  return queryClient.prefetchQuery({ 
    queryKey: WEATHER_QUERY_KEY, 
    queryFn: () => getWeatherUseCase.execute(), 
    staleTime: WEATHER_STALE_TIME
  });
}

export interface UseWeatherResult {
  weather: Weather | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useWeather(isVisible = true): UseWeatherResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: () => getWeatherUseCase.execute(),
    staleTime: WEATHER_STALE_TIME,
    enabled: isVisible,
  });

  return {
    weather: data ?? null,
    loading: isLoading,
    error,
    refetch: () => { refetch(); },
  };
}
