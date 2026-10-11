import { useEffect, useRef, useState } from 'react';
import { Toast } from './Toast';

const LIKE_TOAST_MS = 1800;

// 좋아요/취소 결과 토스트 상태를 함께 관리 — PostDetailCard/TrackPostCollectionView가 같은 문구·타이밍을 쓰게 모음.
// show(isLiked)는 낙관적으로(탭 즉시) 호출하고, 요청이 실패하면 hide()로 거둠. node를 렌더 트리에 꽂아두면
// 표시/자동 숨김을 알아서 처리함. 연타해도 타이머를 새로 잡고(앞선 타이머 취소) key를 바꿔 애니메이션을 처음부터 재생함
export function useLikeToast() {
  const [toast, setToast] = useState<{ message: string; seq: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => clearTimer, []);

  const show = (isLiked: boolean) => {
    clearTimer();
    setToast((prev) => ({ message: isLiked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.', seq: (prev?.seq ?? 0) + 1 }));
    timerRef.current = setTimeout(() => setToast(null), LIKE_TOAST_MS);
  };

  // 좋아요 요청이 실패했을 때 — 429(PL005 요청 제한/PL006 Spotify 한도 초과)는 조용히 되돌리면 "눌렀는데 안 됨"이라
  // 이유를 안내하고, 그 외 실패는 기존처럼 낙관적 토스트만 거둠
  const fail = (error: unknown) => {
    const err = error as { statusCode?: number; code?: string; retryAfterSeconds?: number } | null;
    if (err?.statusCode !== 429) return hide();
    clearTimer();
    const wait = err.retryAfterSeconds ? ` ${err.retryAfterSeconds}초 후 다시 시도해주세요.` : ' 잠시 후 다시 시도해주세요.';
    setToast((prev) => ({ message: `요청이 많아 좋아요를 처리하지 못했어요.${wait}`, seq: (prev?.seq ?? 0) + 1 }));
    timerRef.current = setTimeout(() => setToast(null), LIKE_TOAST_MS * 2);
  };

  const hide = () => {
    clearTimer();
    setToast(null);
  };

  const node = toast ? <Toast key={toast.seq} message={toast.message} variant="light" alignWithFab /> : null;

  return { show, hide, fail, node };
}
