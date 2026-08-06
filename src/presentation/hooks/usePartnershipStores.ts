// 훅(ViewModel): 제휴 매장 목록 조회 (TanStack Query 기반)
import { useQuery } from '@tanstack/react-query';
import { getPartnershipStoresUseCase } from '../../di.js';
import type { PartnerStore } from '../../domain/entities/PartnerStore.js';

const PARTNERSHIP_STALE_TIME = 24 * 60 * 60 * 1000; // 24시간 — 큐레이션 데이터라 자주 안 바뀜
const PARTNERSHIP_QUERY_KEY = ['partnership', 'stores'];

export interface UsePartnershipStoresResult {
  stores: PartnerStore[];
  loading: boolean;
  loadErr: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────
export function usePartnershipStores(): UsePartnershipStoresResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: PARTNERSHIP_QUERY_KEY,
    queryFn: () => getPartnershipStoresUseCase.execute(),
    staleTime: PARTNERSHIP_STALE_TIME,
  });

  return {
    stores: data ?? [],
    loading: isLoading,
    loadErr: isError ? '제휴 매장 정보를 불러오지 못했습니다.' : null,
  };
}
