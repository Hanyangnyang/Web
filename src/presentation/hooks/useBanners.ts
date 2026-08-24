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

// isVisible로 게이팅하지 않음 — staleTime이 12시간이라 소식탭을 다시 눌러도 대부분
// 아직 안 지나있어서 어차피 재요청이 안 나가고, 지나있는 드문 경우(앱을 12시간 넘게
// 계속 켜둔 채 재방문)엔 배너가 부가 콘텐츠라 살짝 오래돼도 괜찮음 — 학식/셔틀과 동일한 판단
export function useBanners(): UseBannersResult {
  const { data, isLoading, error } = useQuery({
    queryKey: BANNERS_QUERY_KEY,
    queryFn: () => getBannersUseCase.execute(),
    staleTime: BANNERS_STALE_TIME,
  });

  return {
    banners: data || [],
    loading: isLoading,
    error,
  };
}
