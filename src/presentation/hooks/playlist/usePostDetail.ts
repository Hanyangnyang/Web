// 훅(ViewModel): 게시글 단건 상세 조회 — 게시글 목록(TrackPostCollectionView 등)에서 하나를 눌러
// 상세화면(PostView)으로 이동할 때 사용. postId가 없으면(딥링크 대상이 아직 없는 화면 등) 호출하지 않음
import { useQuery } from '@tanstack/react-query';
import { getSongByIdUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong } from '../../components/playlist/playlistTypes.js';

export function usePostDetail(postId: string | null) {
  return useQuery({
    queryKey: ['playlist', 'post-detail', postId],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const song = await getSongByIdUseCase.execute({ songId: postId as string, deviceId });
      return mapPlaylistSongToSong(song);
    },
    enabled: !!postId,
    staleTime: 0,
  });
}
