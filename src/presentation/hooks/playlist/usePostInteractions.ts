// 훅: 게시글 카드의 북마크/이모지반응 낙관적 업데이트가 필요로 하는 뮤테이션 + 반응 카운트 계산을 한 곳에 모음.
// PostDetailCard(단일 게시글, useState 하나)와 TrackPostCollectionView(게시글 목록, postId별 map)는 로컬 상태를
// 담는 방식이 서로 달라 상태 자체를 이 훅이 들고 있진 않지만, 값 계산 로직(반응 카운트 증감)과 뮤테이션 인스턴스는
// 두 화면이 동일하게 반복하던 부분이라 여기로 뽑음
import { useToggleBookmark } from './useToggleBookmark.js';
import { useToggleReaction } from './useToggleReaction.js';
import { type ReactionKey } from '../../components/playlist/postReactions.js';
import { type ReactionState } from '../../components/playlist/playlistTypes.js';

export function usePostInteractionMutations() {
  return {
    toggleBookmark: useToggleBookmark(),
    toggleReactionMutation: useToggleReaction(),
  };
}

// 이모지 하나를 낙관적으로 뒤집은 다음 상태를 계산 — 서버가 내려준 count엔 이미 내 반응이 포함돼 있어 +1/-1로 계산.
// PostDetailCard(단일 상태)/TrackPostCollectionView(postId별 map의 한 항목) 양쪽에서 같은 계산이라 순수 함수로 공유
export function nextOptimisticReaction(current: ReactionState, key: ReactionKey): ReactionState {
  const entry = current[key] ?? { count: 0, mine: false };
  const mine = !entry.mine;
  const count = Math.max(0, entry.count + (mine ? 1 : -1));
  return { ...current, [key]: { count, mine } };
}
