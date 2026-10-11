// 훅(ViewModel): 좋아요 토글 — 곡(trackId) 단위 API라 같은 곡의 모든 게시글에 공통 적용되고, 서버가 현재 상태 보고 등록/취소를 알아서 판단하므로 trackId만 넘기면 됨.
// 결과 isLiked로 화면 상태를 서버 값과 맞춤(낙관적 업데이트는 호출부에서 처리)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
import { toggleLikeUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { patchTrackInListCaches, patchTrackInChartCaches } from './playlistQueryKeys.js';

export function useToggleLike() {
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  return useMutation({
    mutationKey: ['playlist', 'toggle-like'],
    mutationFn: async (trackId: string) => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleLikeUseCase.execute({ trackId, deviceId });
    },
    onSuccess: (isLiked, trackId) => {
      // 참여 지표 — 좋아요 버튼이 어느 화면에 있든 이 훅 하나를 거치고, 서버가 확정한 결과(등록/취소)만 집계됨
      posthog?.capture('playlist_like_toggled', { track_id: trackId, liked: isLiked });
      patchTrackInListCaches(queryClient, trackId, (song) => ({ ...song, isLiked: isLiked }));
      patchTrackInChartCaches(queryClient, trackId, isLiked);
    },
  });
}
