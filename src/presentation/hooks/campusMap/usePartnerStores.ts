// 훅(ViewModel): 제휴 매장 목록 조회
import { useQuery } from '@tanstack/react-query';
import { getPartnerStoresUseCase } from '../../../di.js';
import type { PartnerStore } from '../../../domain/entities/PartnerStore.js';

// 12시간 — 백엔드 제휴매장 캐시(Redis) TTL과 동일. 그보다 자주 물어봐도 더 최신 데이터를 못 받는다.
// 예전엔 손으로 관리하던 partnerships.json이라 createStaticDataQuery(24h 고정)를 같이 썼는데,
// 이제 실제 백엔드 API가 됐으니 다른 마이그레이션된 도메인(gym·menu·banner 등)처럼 전용 staleTime을 둔다.
const PARTNERSHIP_STALE_TIME = 12 * 60 * 60 * 1000;
const PARTNERSHIP_QUERY_KEY = ['partnership', 'stores'];

export interface UsePartnerStoresResult {
  stores: PartnerStore[];
  loading: boolean;
  loadErr: string | null;
  refetch: () => void;
}

export function usePartnerStores(): UsePartnerStoresResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: PARTNERSHIP_QUERY_KEY,
    queryFn: () => getPartnerStoresUseCase.execute(),
    staleTime: PARTNERSHIP_STALE_TIME,
  });

  return {
    stores: data ?? [],
    loading: isLoading,
    loadErr: isError ? '제휴 매장 정보를 불러오지 못했습니다' : null,
    refetch: () => { refetch(); },
  };
}
