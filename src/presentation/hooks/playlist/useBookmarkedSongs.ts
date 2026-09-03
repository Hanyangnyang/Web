// 훅(ViewModel): 저장한 곡 화면용
import { useQuery } from '@tanstack/react-query';
import { getBookmarkedSongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { BOOKMARKED_SONGS_QUERY_KEY } from './playlistQueryKeys.js';

const BOOKMARKED_SONGS_SIZE = 50;

export function useBookmarkedSongs() {
  return useQuery<Song[]>({
    queryKey: BOOKMARKED_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getBookmarkedSongsUseCase.execute({ deviceId, size: BOOKMARKED_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}
