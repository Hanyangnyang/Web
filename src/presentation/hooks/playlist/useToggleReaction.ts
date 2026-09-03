// 훅(ViewModel): 이모지 반응 토글 — 이모지 버튼이 눌리는 곳 어디서든. 서버가 그 곡의 9종 반응 전체 최신
// 카운트를 함께 내려주므로, 호출부는 결과를 그대로 화면 상태에 덮어씌우면 됨(낙관적 업데이트는 호출부에서 처리)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleReactionUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { type PlaylistReaction } from '../../components/playlist/playlistTypes.js';
import { patchSongInListCaches } from './playlistQueryKeys.js';

export interface ToggleReactionInput {
  songId: string;
  reactionType: string;
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['playlist', 'toggle-reaction'],
    mutationFn: async (input: ToggleReactionInput): Promise<PlaylistReaction[]> => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleReactionUseCase.execute({ ...input, deviceId });
    },
    onSuccess: (updatedReactions, input) => {
      patchSongInListCaches(queryClient, input.songId, (song) => ({ ...song, reactions: updatedReactions }));
    },
  });
}
