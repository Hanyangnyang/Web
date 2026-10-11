// 훅(ViewModel): 홈 "내가 추천한 곡" 미리보기용 — 앞의 10개만 받아옴(전체 목록은 useMySongsInfinite)
import { useQuery } from '@tanstack/react-query';
import { getMySongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { MY_SONGS_QUERY_KEY } from './playlistQueryKeys.js';

const MY_SONGS_PREVIEW_SIZE = 10;

export function useMySongs() {
  return useQuery<Song[]>({
    queryKey: MY_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const { songs } = await getMySongsUseCase.execute({ deviceId, size: MY_SONGS_PREVIEW_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}
