import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getLibraryStatusUseCase } from '../../di.js';
import type { LibraryStatus } from '../../domain/repositories/ILibraryRepository.js';

const LIBRARY_STALE_TIME = 180000; // 3분 (백엔드 LibraryScheduler 실제 갱신 주기와 일치)
const LIBRARY_QUERY_KEY = ['portal', 'library'];

export function prefetchLibraryStatus() {
  return queryClient.prefetchQuery({ 
    queryKey: LIBRARY_QUERY_KEY, 
    queryFn: () => getLibraryStatusUseCase.execute(), 
    staleTime: LIBRARY_STALE_TIME
  });
}

export interface UseLibraryStatusResult {
  library: LibraryStatus | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLibraryStatus(isActive = true): UseLibraryStatusResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: () => getLibraryStatusUseCase.execute(),
    staleTime: LIBRARY_STALE_TIME,
    enabled: isActive,
  });

  return {
    library: data ?? null,
    loading: isLoading,
    error,
    refetch: () => { refetch(); },
  };
}
