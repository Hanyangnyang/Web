import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getBannersUseCase } from '../../di.js';

const CACHE_TTL = 86400000; // 24시간 (배너는 거의 바뀌지 않아 하루 주기)
const BANNERS_QUERY_KEY = ['banners'];

// ─── 공개 Prefetch 함수 (App.jsx 에서 앱 시작 시 호출) ─────────────
export function prefetchBanners() {
  return queryClient.prefetchQuery({ queryKey: BANNERS_QUERY_KEY, queryFn: () => getBannersUseCase.execute(), staleTime: CACHE_TTL });
}

// ─── Hook ─────────────────────────────────────────────────────────
export function useBanners(isVisible = true) {
  const { data, isLoading } = useQuery({
    queryKey: BANNERS_QUERY_KEY,
    queryFn: () => getBannersUseCase.execute(),
    staleTime: CACHE_TTL,
    enabled: isVisible,
  });

  return {
    banners: data || [],
    loading: isLoading,
  };
}
