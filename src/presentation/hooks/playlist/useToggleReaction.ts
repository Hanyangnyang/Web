// 훅(ViewModel): 이모지 반응 토글 — 이모지 버튼이 눌리는 곳 어디서든. 서버가 그 곡의 반응 전체 최신
// 카운트를 함께 내려주므로, 호출부는 결과를 그대로 화면 상태에 덮어씌우면 됨(낙관적 업데이트는 호출부에서 처리)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
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
  const posthog = usePostHog();

  return useMutation({
    mutationKey: ['playlist', 'toggle-reaction'],
    mutationFn: async (input: ToggleReactionInput): Promise<PlaylistReaction[]> => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleReactionUseCase.execute({ ...input, deviceId });
    },
    onSuccess: (updatedReactions, input) => {
      // 참여 지표 — 토글이라 서버가 내려준 최신 상태(isReacted)로 "남김/취소"를 구분해서 집계
      const reacted = updatedReactions.find((r) => r.type === input.reactionType)?.isReacted ?? null;
      posthog?.capture('playlist_reaction_toggled', { song_id: input.songId, reaction_type: input.reactionType, reacted });
      patchSongInListCaches(queryClient, input.songId, (song) => ({ ...song, reactions: updatedReactions }));
    },
  });
}
