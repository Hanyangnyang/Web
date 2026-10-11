// 훅(ViewModel): 인기차트 곡 좋아요 — 곡(trackId) 단위 토글 API(useToggleLike)를 쓰되, 차트 캐시를 먼저 낙관적으로 뒤집고
// 실패 시 되돌림. 성공 시 서버 값 반영(차트 캐시 포함)은 useToggleLike.onSuccess가 처리함
import { useQueryClient } from '@tanstack/react-query';
import { useToggleLike } from './useToggleLike.js';
import { LIKED_SONGS_QUERY_KEY, patchTrackInChartCaches } from './playlistQueryKeys.js';

export function useChartTrackLike(onLikeChanged?: (isLiked: boolean) => void, onFailed?: () => void) {
  const queryClient = useQueryClient();
  const toggleLike = useToggleLike();

  const toggle = (trackId: string, currentLiked: boolean) => {
    const optimistic = !currentLiked;
    patchTrackInChartCaches(queryClient, trackId, optimistic);
    onLikeChanged?.(optimistic);
    toggleLike.mutate(trackId, {
      onSuccess: (isLiked) => {
        if (isLiked !== optimistic) onLikeChanged?.(isLiked); // 서버 상태가 예상과 다르면 실제 결과로 안내를 바로잡음
        // 저장한 곡 목록에 새로 추가/제거되므로 다음 진입 때 서버 값으로 다시 받게 함
        queryClient.invalidateQueries({ queryKey: LIKED_SONGS_QUERY_KEY });
      },
      onError: () => {
        patchTrackInChartCaches(queryClient, trackId, currentLiked);
        onFailed?.();
      },
    });
  };

  return { toggle };
}
