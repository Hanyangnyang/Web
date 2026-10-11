// 훅: 목록 맨 아래 감시용 요소가 화면 근처(200px)에 오면 다음 페이지를 자동으로 불러오는 무한 스크롤 트리거.
// 반환된 ref를 목록 끝 요소에 달면 됨 — 요소는 hasNextPage일 때만 렌더해야 함(없으면 관찰하지 않음).
// itemCount를 의존성에 넣어서, 새 페이지가 붙은 뒤에도 감시 요소가 여전히 화면 안이면 다시 다음 페이지를 이어 받음
import { useEffect, useRef } from 'react';

interface UseInfiniteScrollSentinelParams {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
  itemCount: number;
}

export function useInfiniteScrollSentinel({ hasNextPage, isFetchingNextPage, fetchNextPage, itemCount }: UseInfiniteScrollSentinelParams) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, itemCount]);

  return sentinelRef;
}
