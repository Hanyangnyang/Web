import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { initSentry } from './sentry.js';

// 앱 전역에서 하나만 쓰는 QueryClient.
// usePortalData/useBanners의 훅(useQuery)과 App.jsx의 prefetch 호출(queryClient.prefetchQuery)이
// 항상 같은 캐시를 보도록 이 인스턴스를 공유한다.
export const queryClient = new QueryClient({
  // 쿼리 실패는 react-query가 삼켜서 error 상태로 바꾸기 때문에, 전역 에러 핸들러까지 도달하지 않는다.
  // 여기서 한 번 모아 보내지 않으면 모든 API 실패가 Sentry에 전혀 남지 않는다.
  // (재시도를 모두 소진하고 최종 실패했을 때만 호출된다)
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (!import.meta.env.PROD) return; // 개발 중엔 어차피 Sentry가 비활성이라 SDK만 헛로드된다
      if (navigator.onLine === false) return; // 기기가 오프라인일 때의 실패는 서버 문제가 아니다. 쌓이면 진짜 오류가 묻힌다.
      initSentry().then(Sentry => {
        Sentry.captureException(error, {
          tags: { queryKey: JSON.stringify(query.queryKey) }, // 어느 API가 실패했는지
        });
      });
    },
  }),
  // 뮤테이션(useMutation)은 QueryCache가 아니라 별도 캐시로 관리돼서, 위 onError로는 안 잡힌다.
  // 뮤테이션은 기본적으로 재시도를 안 하기 때문에(retry: false) 실패 즉시 여기로 온다.
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!import.meta.env.PROD) return;
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
    },
  },
});

// 앱 재시작 후에도 마지막 데이터를 즉시 보여주기 위한 localStorage 영속화
// (기존 usePortalData.js/useBanners.js가 각각 손으로 하던 localStorage.setItem/getItem을 대체)
//
// 개발 중에는 끈다. public/*.json(매장·건물·흡연장·셔틀·헬스장)은 staleTime이 24시간이라,
// 저장된 캐시가 복원되면 파일을 고쳐도 새로고침조차 옛 데이터를 보여준다 —
// 캐시를 손으로 지우기 전까지 변경이 화면에 반영되지 않는다.
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'hyu_rq_cache_v1',
  });
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000,
  });
}
