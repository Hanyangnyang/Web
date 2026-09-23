import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getBannersUseCase } from '../../di.js';
import { cacheBannersForSplash } from './useSplashBanner.js';
import type { Banner } from '../../domain/entities/Banner.js';

const BANNERS_STALE_TIME = 5 * 60 * 1000; // 5분 — 관리자가 등록/수정/순서변경/삭제 시 백엔드는 즉시 evict하므로, 새 배너가 바로 반영 안 되는 답답함을 줄이려고 다른 엔드포인트(1시간)보다 짧게 잡음. 배너는 요청 자체가 가볍고 DAU도 적어 부하 영향 미미
const BANNERS_QUERY_KEY = ['banners'];

// useBanners()/prefetchBanners() 공용 queryFn — 소식탭을 한 번도 안 들어간 사용자도
// prefetchBanners()만으로 다음 부팅 스플래시용 캐싱까지 끝나도록, fetch 시점에 바로 캐싱한다
// (react-query가 같은 queryKey를 dedupe하므로 둘 중 먼저 도는 쪽에서 한 번만 실행됨)
async function fetchBanners(): Promise<Banner[]> {
  const banners = await getBannersUseCase.execute();
  const splashEligible = banners.filter(b => b.placement === 'SPLASH' || b.placement === 'BOTH');
  cacheBannersForSplash(splashEligible);
  return banners;
}

export function prefetchBanners() {
  return queryClient.prefetchQuery({ queryKey: BANNERS_QUERY_KEY, queryFn: fetchBanners, staleTime: BANNERS_STALE_TIME });
}

export interface UseBannersResult {
  banners: Banner[];
  loading: boolean;
  error: Error | null;
}

export function useBanners(isActive = true): UseBannersResult {
  const { data, isLoading, error } = useQuery({
    queryKey: BANNERS_QUERY_KEY,
    queryFn: fetchBanners,
    staleTime: BANNERS_STALE_TIME,
    enabled: isActive,
  });

  // 소식탭 캐러셀에는 BANNER/BOTH만 노출
  const banners = useMemo(
    () => (data || []).filter(b => b.placement === 'BANNER' || b.placement === 'BOTH'),
    [data]
  );

  return {
    banners,
    loading: isLoading,
    error,
  };
}
