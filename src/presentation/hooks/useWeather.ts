import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getWeatherUseCase } from '../../di.js';
import type { Weather } from '../../domain/entities/Weather.js';

const CACHE_TTL = 900000; // 15분
const WEATHER_QUERY_KEY = ['portal', 'weather'];

export function prefetchWeather() {
  return queryClient.prefetchQuery({ queryKey: WEATHER_QUERY_KEY, queryFn: () => getWeatherUseCase.execute(), staleTime: CACHE_TTL });
}

export interface UseWeatherResult {
  weather: Weather | null;
  loading: boolean;
  error: Error | null;
}

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
