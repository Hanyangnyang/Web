import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getBannersUseCase } from '../../di.js';
import type { Banner } from '../../domain/entities/Banner.js';

const BANNERS_STALE_TIME = 12 * 60 * 60 * 1000; // 12시간 — 백엔드 Banner 캐시 TTL과 동일 (관리자가 등록/수정/순서변경/삭제 시 즉시 evict)
const BANNERS_QUERY_KEY = ['banners'];

export function prefetchBanners() {
  return queryClient.prefetchQuery({ queryKey: BANNERS_QUERY_KEY, queryFn: () => getBannersUseCase.execute(), staleTime: BANNERS_STALE_TIME });
}

export interface UseBannersResult {
  banners: Banner[];
  loading: boolean;
  error: Error | null;
}

export function useBanners(isActive = true): UseBannersResult {
  const { data, isLoading, error } = useQuery({
    queryKey: BANNERS_QUERY_KEY,
    queryFn: () => getBannersUseCase.execute(),
    staleTime: BANNERS_STALE_TIME,
    enabled: isActive,
  });

  return {
    banners: data || [],
    loading: isLoading,
    error,
  };
}
