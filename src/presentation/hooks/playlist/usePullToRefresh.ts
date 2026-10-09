// 훅(ViewModel): 스크롤 컨테이너 맨 위에서 아래로 당겨 새로고침 (인스타그램식 pull-to-refresh)
import { useEffect, useRef, useState, type RefObject } from 'react';

const PULL_THRESHOLD_PX = 64; // 이 거리 이상 당겼다 놓으면 새로고침
const MAX_PULL_PX = 96;
const PULL_RESISTANCE = 0.5; // 손가락 이동 거리 대비 실제 표시 거리 (당길수록 뻑뻑한 느낌)

interface Options {
  containerRef: RefObject<HTMLElement | null>;
  onRefresh: () => Promise<unknown> | void;
  enabled: boolean;
}

export function usePullToRefresh({ containerRef, onRefresh, enabled }: Options) {
  const [pull, setPull] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // 리스너는 한 번만 등록하고 최신 값은 ref로 읽음 — 렌더마다 리스너를 갈아끼우지 않기 위함
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const refreshingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!enabled || !el) return;

    let startY: number | null = null;
    let current = 0;

    const onTouchStart = (e: TouchEvent) => {
      // 맨 위에서 시작한 터치만 당김으로 취급 (이미 새로고침 중이면 무시)
      startY = el.scrollTop <= 0 && !refreshingRef.current ? e.touches[0].clientY : null;
      current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || el.scrollTop > 0) {
        if (current !== 0) { current = 0; setPull(0); }
        return;
      }
      // 브라우저/WebView 기본 오버스크롤·시스템 새로고침을 막아 우리 인디케이터만 보이게 함
      if (e.cancelable) e.preventDefault();
      current = Math.min(dy * PULL_RESISTANCE, MAX_PULL_PX);
      setPull(current);
    };

    const onTouchEnd = async () => {
      if (startY === null) return;
      startY = null;
      if (current < PULL_THRESHOLD_PX) {
        current = 0;
        setPull(0);
        return;
      }
      current = 0;
      refreshingRef.current = true;
      setIsRefreshing(true);
      setPull(PULL_THRESHOLD_PX); // 새로고침 중에는 인디케이터를 기준 위치에 고정
      try {
        await onRefreshRef.current();
      } finally {
        refreshingRef.current = false;
        setIsRefreshing(false);
        setPull(0);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false }); // preventDefault 하려면 non-passive여야 함
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerRef, enabled]);

  return { pull, isRefreshing, threshold: PULL_THRESHOLD_PX };
}
