// 훅(ViewModel): 좋아요(북마크) 토글 — 서버가 현재 상태 보고 등록/취소를 알아서 판단하므로 songId만 넘기면 됨.
// 결과 isLiked로 화면 상태를 서버 값과 맞춤(낙관적 업데이트는 호출부에서 처리)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleBookmarkUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { patchSongInListCaches } from './playlistQueryKeys.js';

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['playlist', 'toggle-bookmark'],
    mutationFn: async (songId: string) => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleBookmarkUseCase.execute({ songId, deviceId });
    },
    onSuccess: (isLiked, songId) => {
      patchSongInListCaches(queryClient, songId, (song) => ({ ...song, isBookmarked: isLiked }));
    },
  });
}
