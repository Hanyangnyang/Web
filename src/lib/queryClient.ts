import { QueryClient, QueryCache, MutationCache, onlineManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { initSentry } from './sentry.js';
import { subscribeToNetworkStatus } from '../infrastructure/network/NetworkStatus.js';
import type { ApiValidationError, HttpError } from '../infrastructure/http/HttpClient.js';

// 앱 전역에서 하나만 쓰는 QueryClient
export const queryClient = new QueryClient({
  // 쿼리 실패는 react-query가 삼켜서 error 상태로 바꾸기 때문에, 전역 에러 핸들러까지 도달하지 않는다
  // 여기서 한 번 모아 보내지 않으면 모든 API 실패가 Sentry에 전혀 남지 않는다
  // (재시도를 모두 소진하고 최종 실패했을 때만 호출된다)
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (navigator.onLine === false) return; // 기기가 오프라인일 때 에러를 반환하지 않는다
      const err = error as (ApiValidationError & HttpError);
      initSentry().then(Sentry => {
        Sentry.captureException(error, {
          tags: {
            queryKey: JSON.stringify(query.queryKey), // 어느 API가 실패했는지 (프론트 쿼리 키 기준)
            ...(err.area && { area: err.area }),           // 어느 기능인지, 한글 이름표 (예: '배너')
            ...(err.endpoint && { endpoint: err.endpoint }), // 실제로 요청이 나간 백엔드 URL
          },
        });
      });
    },
  }),
  // 뮤테이션(useMutation)은 QueryCache가 아니라 별도 캐시로 관리돼서, 위 onError로는 안 잡힌다.
  // 뮤테이션은 기본적으로 재시도를 안 하기 때문에(retry: false) 실패 즉시 여기로 온다.
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (navigator.onLine === false) return;
      initSentry().then(Sentry => {
        Sentry.captureException(error, {
          tags: { mutationKey: JSON.stringify(mutation.options.mutationKey ?? []) },
        });
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000,   // 기본 15분
      gcTime: 24 * 60 * 60 * 1000, // 24시간
      refetchOnWindowFocus: false, // 모바일 웹뷰 특성상 불필요, 탭 재진입 갱신은 isVisible로 각 훅이 직접 제어
      retry: 2, 
    },
  },
});

// 기본 온라인 감지(window의 online/offline 이벤트)는 네이티브 WebView 안에서 실제 기기 네트워크
// 복구 시점과 안 맞을 수 있다 — 이미 있는 Capacitor Network 플러그인 기반 감지 로직을 그대로 재사용한다
// (구독 함수 시그니처가 정확히 일치해 그대로 대입 가능)
onlineManager.setEventListener(subscribeToNetworkStatus);

// 앱 재시작 후에도 마지막 데이터를 즉시 보여주기 위한 localStorage 영속화
if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'hyu_rq_cache_v1',
  });
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
  });
}
