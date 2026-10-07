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

  const hide = () => {
    clearTimer();
    setToast(null);
  };

  const node = toast ? <Toast key={toast.seq} message={toast.message} variant="light" alignWithFab /> : null;

  return { show, hide, node };
}
