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
      if (!import.meta.env.PROD) return; // 개발 중엔 어차피 Sentry가 비활성이라 SDK만 헛로드된다
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
      retry: 2, 
    },
  },
});

// 기본 온라인 감지(window의 online/offline 이벤트)는 네이티브 WebView 안에서 실제 기기 네트워크
// 복구 시점과 안 맞을 수 있다 — 이미 있는 Capacitor Network 플러그인 기반 감지 로직을 그대로 재사용한다
// (구독 함수 시그니처가 정확히 일치해 그대로 대입 가능)
onlineManager.setEventListener(subscribeToNetworkStatus);

// 앱 재시작 후에도 마지막 데이터를 즉시 보여주기 위한 localStorage 영속화
// (기존 usePortalData.js/useBanners.js가 각각 손으로 하던 localStorage.setItem/getItem을 대체)
//
// 개발 중에도 켜둔다 — staleTime이 긴 API가 새로고침마다 다시 로딩중 상태로 보이면
// "데이터 있으면 계속 보여주기" 동작을 로컬에서 확인할 수 없다.
// ⚠️ 단, 백엔드가 응답 필드를 바꿨는데 캐시가 그대로 복원되면 옛 모양 그대로 화면에 남는다 —
// 그럴 땐 애플리케이션 탭에서 localStorage의 hyu_rq_cache를 지우고 새로고침할 것.
/**
 * 저장된 '엔티티의 모양' 버전.
 *
 * 여기 담기는 건 응답 원본(DTO)이 아니라 매퍼를 이미 통과한 엔티티다. 그래서 앱을 다시 열 때
 * 복원되는 값은 매퍼를 거치지 않는다 — 엔티티 인터페이스를 바꾸면 옛 캐시가 새 코드로
 * 그대로 흘러들어 조용히 깨진다. 그럴 때 이 문자열을 올린다.
 *
 * 올려야 하는 변경: 필드 이름·중첩 구조·값의 의미가 바뀌거나 필수 필드가 늘어난 경우.
 * 올릴 필요 없는 변경: UI, 파일·타입 이름, staleTime 조정, 없어도 되는 선택 필드 추가.
 *
 * key가 아니라 buster를 쓰는 이유: buster가 다르면 라이브러리가 복원을 건너뛰는 데서 그치지 않고
 * 저장된 항목을 지운다(persist.js의 `busted → persister.removeClient()`). key를 바꾸는 방식은
 * 옛 항목이 localStorage에 그대로 남아 버전을 올릴 때마다 쓰레기가 쌓인다.
 *
 * 값은 크기를 비교하지 않고 같은지만 본다. 그래서 배포 순서와 무관하게 '직전 배포와 다르기만'
 * 하면 되고, 브랜치별로 번호를 미리 나눠 잡아도 안전하다.
 *
 * v2 — 백엔드 API 이전 작업(학식·셔틀·지하철·헬스장·배너·도서관좌석 등)에서 엔티티 필드가
 *   대거 바뀌어 사용.
 *
 * v3 (캠퍼스맵): 매장 필드 snake_case → camelCase(is_active → isActive 등),
 *   건물 openSpaces가 string[] → OpenSpace[], 좌표 미확보 표기가 {0,0} → null.
 *   이전 캐시를 그대로 읽으면 매장이 전부 비활성으로 걸러지고(isActive undefined),
 *   오픈스페이스 자리에 undefined가 찍히며, {0,0} 건물 마커가 되살아난다.
 */
const CACHE_BUSTER = 'v3';

// buster 도입 전에는 키에 버전을 붙였다. 그 시절 항목은 아무도 읽지 않으므로 한 번 지워준다.
const LEGACY_CACHE_KEYS = ['hyu_rq_cache_v1'];

if (typeof window !== 'undefined') {
  // 저장 공간이 꽉 찼거나 접근이 막힌 환경(사파리 프라이빗 등)에서도 앱은 계속 떠야 한다
  try {
    LEGACY_CACHE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  } catch { /* 무시 */ }

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'hyu_rq_cache',
  });
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    buster: CACHE_BUSTER,
  });
}
