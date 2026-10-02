// 훅(ViewModel): 내가 등록한 곡 화면용
import { useQuery } from '@tanstack/react-query';
import { getMySongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { MY_SONGS_QUERY_KEY } from './playlistQueryKeys.js';

const MY_SONGS_SIZE = 20;

export function useMySongs() {
  return useQuery<Song[]>({
    queryKey: MY_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getMySongsUseCase.execute({ deviceId, size: MY_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}
