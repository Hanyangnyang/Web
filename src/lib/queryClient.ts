import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// 앱 전역에서 하나만 쓰는 QueryClient.
// usePortalData/useBanners의 훅(useQuery)과 App.jsx의 prefetch 호출(queryClient.prefetchQuery)이
// 항상 같은 캐시를 보도록 이 인스턴스를 공유한다.
export const queryClient = new QueryClient({
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
