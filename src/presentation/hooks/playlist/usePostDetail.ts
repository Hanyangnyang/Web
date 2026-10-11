// 훅(ViewModel): 게시글 단건 상세 조회 — 게시글 목록(TrackPostCollectionView 등)에서 하나를 눌러
// 상세화면(PostView)으로 이동할 때 사용. postId가 없으면(딥링크 대상이 아직 없는 화면 등) 호출하지 않음
import { useQuery } from '@tanstack/react-query';
import { getSongByIdUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { POST_DETAIL_QUERY_KEY } from './playlistQueryKeys.js';
import { SONG_LIST_STALE_TIME } from './useSongListInfinite.js';
import { mapPlaylistSongToSong } from '../../components/playlist/playlistTypes.js';

export function usePostDetail(postId: string | null) {
  return useQuery({
    queryKey: [...POST_DETAIL_QUERY_KEY, postId],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const song = await getSongByIdUseCase.execute({ songId: postId as string, deviceId });
      return mapPlaylistSongToSong(song);
    },
    enabled: !!postId,
    // 목록과 같은 1분 — 최근추가된곡 등을 갔다 돌아와도 스켈레톤/재호출 없이 캐시로 바로 보임.
    // 내가 누른 좋아요/반응은 토글 성공 시 이 캐시도 같이 패치(playlistQueryKeys)해서 돌아와도 반영돼 있음.
    // PostDetailCard는 처음 받은 값으로 로컬 state를 만들기 때문에, 재조회 결과가 오면 PostView가 key로 카드를 새 값으로 다시 시작시킴
    staleTime: SONG_LIST_STALE_TIME,
  });
}
