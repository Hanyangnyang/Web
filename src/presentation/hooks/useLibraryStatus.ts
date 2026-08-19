import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient.js';
import { getLibraryStatusUseCase } from '../../di.js';
import type { LibraryStatus } from '../../domain/repositories/ILibraryRepository.js';

const LIBRARY_STALE_TIME = 900000; // 15분
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
}

export function useLibraryStatus(isVisible = true): UseLibraryStatusResult {
  const { data, isLoading, error } = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: () => getLibraryStatusUseCase.execute(),
    staleTime: LIBRARY_STALE_TIME,
    enabled: isVisible,
  });

  return {
    library: data ?? null,
    loading: isLoading,
    error,
  };
}
