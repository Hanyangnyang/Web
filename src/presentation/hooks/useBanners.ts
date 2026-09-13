import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getBannersUseCase } from '../../di.js';
import { cacheBannersForSplash } from './useSplashBanner.js';
import type { Banner } from '../../domain/entities/Banner.js';

const BANNERS_STALE_TIME = 5 * 60 * 1000; // 5분 — 관리자가 등록/수정/순서변경/삭제 시 백엔드는 즉시 evict하므로, 새 배너가 바로 반영 안 되는 답답함을 줄이려고 다른 엔드포인트(1시간)보다 짧게 잡음. 배너는 요청 자체가 가볍고 DAU도 적어 부하 영향 미미
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

  // 다음 부팅 스플래시가 즉시 보여줄 수 있도록, 받아온 배너를 매번 최신 상태로 캐싱해둔다
  useEffect(() => {
    if (data && data.length > 0) cacheBannersForSplash(data);
  }, [data]);

  return {
    banners: data || [],
    loading: isLoading,
    error,
  };
}
