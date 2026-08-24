// 훅(ViewModel): 제휴 매장 목록 조회
import { getPartnerStoresUseCase } from '../../../di.js';
import type { PartnerStore } from '../../../domain/entities/PartnerStore.js';
import { createStaticDataQuery, type StaticDataQueryOptions } from '../createStaticDataQuery.js';

const usePartnerStoresQuery = createStaticDataQuery<PartnerStore>({
  queryKey: ['partnership', 'stores'],
  fetcher: () => getPartnerStoresUseCase.execute(),
  errorMessage: '제휴 매장 정보를 불러오지 못했습니다.',
});

export function usePartnerStores(options?: StaticDataQueryOptions) {
  const { data, loading, loadErr } = usePartnerStoresQuery(options);
  return { stores: data, loading, loadErr };
}
