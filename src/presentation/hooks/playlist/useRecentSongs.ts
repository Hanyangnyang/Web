// 훅(ViewModel): 최근추가된곡 화면의 플레이리스트 피드 곡 목록 로딩
import { useQuery } from '@tanstack/react-query';
import { getRecentSongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { RECENT_SONGS_QUERY_KEY } from './playlistQueryKeys.js';

const RECENT_SONGS_SIZE = 50;

export function useRecentSongs() {
  return useQuery<Song[]>({
    queryKey: RECENT_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getRecentSongsUseCase.execute({ deviceId, size: RECENT_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}
