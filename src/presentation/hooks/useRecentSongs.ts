// 훅(ViewModel): 최근추가된곡 화면의 플레이리스트 피드 곡 목록 로딩 + 곡 추천/등록
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecentSongsUseCase, submitSongUseCase } from '../../di.js';
import { getOrCreateAnonymousUserId } from '../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../components/playlist/playlistTypes.js';

const RECENT_SONGS_QUERY_KEY = ['playlist', 'recent-songs'];
const RECENT_SONGS_SIZE = 50;

export function useRecentSongs() {
  return useQuery<Song[]>({
    queryKey: RECENT_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getRecentSongsUseCase.execute({ deviceId, size: RECENT_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
  });
}

export interface SubmitSongInput {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: string[];
}

// 곡 추천/등록 — 성공하면 최근추가된곡 쿼리 캐시 맨 앞에 바로 얹어서, 재조회 없이 즉시 화면에 반영
export function useSubmitSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      const song = await submitSongUseCase.execute({ ...input, deviceId });
      return mapPlaylistSongToSong(song);
    },
    onSuccess: (song) => {
      queryClient.setQueryData<Song[]>(RECENT_SONGS_QUERY_KEY, (prev) => (prev ? [song, ...prev] : [song]));
    },
  });
}
