import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getWeatherBriefingUseCase } from '../../di.js';
import type { WeatherBriefing } from '../../domain/entities/WeatherBriefing.js';

const BRIEFING_STALE_TIME = 1800000; // 30분 (백엔드 weatherBriefing 캐시 TTL과 일치, 매시 22분 갱신)
const BRIEFING_QUERY_KEY = ['portal', 'weather', 'briefing'];

export function prefetchWeatherBriefing() {
  return queryClient.prefetchQuery({
    queryKey: BRIEFING_QUERY_KEY,
    queryFn: () => getWeatherBriefingUseCase.execute(),
    staleTime: BRIEFING_STALE_TIME,
  });
}

export interface UseWeatherBriefingResult {
  briefing: WeatherBriefing | null;
  loading: boolean;
  error: Error | null;
}

export function useWeatherBriefing(isActive = true): UseWeatherBriefingResult {
  const { data, isLoading, error } = useQuery({
    queryKey: BRIEFING_QUERY_KEY,
    queryFn: () => getWeatherBriefingUseCase.execute(),
    staleTime: BRIEFING_STALE_TIME,
    enabled: isActive,
  });

  return {
    briefing: data ?? null,
    loading: isLoading,
    error,
  };
}
