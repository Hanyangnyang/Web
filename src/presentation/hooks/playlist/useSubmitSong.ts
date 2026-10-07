// 훅(ViewModel): 곡 추천/등록 — 성공하면 최근추가된곡 쿼리 캐시 맨 앞에 바로 얹어서, 재조회 없이 즉시 화면에 반영
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSongUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { RECENT_SONGS_QUERY_KEY, SONG_CREATION_STATUS_QUERY_KEY } from './playlistQueryKeys.js';

export interface SubmitSongInput {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: string[];
}

export function useSubmitSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['playlist', 'submit-song'], // Sentry에서 어느 뮤테이션이 실패했는지 구분하는 태그로 쓰임
    mutationFn: async (input: SubmitSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      const song = await submitSongUseCase.execute({ ...input, deviceId });
      return mapPlaylistSongToSong(song);
    },
    onSuccess: (song) => {
      queryClient.setQueryData<Song[]>(RECENT_SONGS_QUERY_KEY, (prev) => (prev ? [song, ...prev] : [song]));
    },
    // 성공하면 남은 횟수가 바뀌고, 실패해도(다른 기기에서 한도를 채웠거나 임시 차단이 걸린 경우 등) 등록 가능 상태가
    // 달라졌을 수 있어서 결과와 무관하게 다시 조회 — 화면에 떠 있는 한도/차단 안내가 바로 최신 값으로 바뀜
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SONG_CREATION_STATUS_QUERY_KEY });
    },
  });
}
