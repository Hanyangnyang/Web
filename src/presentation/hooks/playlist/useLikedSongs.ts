// 훅(ViewModel): 저장한 곡 화면용
import { useQuery } from '@tanstack/react-query';
import { getLikedSongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { LIKED_SONGS_QUERY_KEY } from './playlistQueryKeys.js';

const LIKED_SONGS_SIZE = 50;

export function useLikedSongs() {
  return useQuery<Song[]>({
    queryKey: LIKED_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getLikedSongsUseCase.execute({ deviceId, size: LIKED_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}
