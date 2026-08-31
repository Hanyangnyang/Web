import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getBannersUseCase } from '../../di.js';
import type { Banner } from '../../domain/entities/Banner.js';

const BANNERS_STALE_TIME = 60 * 60 * 1000; // 1시간 — 백엔드 Banner 캐시 TTL(12시간)보다 짧게 재검증 (관리자가 등록/수정/순서변경/삭제 시 백엔드는 즉시 evict함)
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
