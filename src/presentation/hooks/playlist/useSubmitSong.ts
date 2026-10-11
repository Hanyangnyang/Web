// 훅(ViewModel): 곡 추천/등록 — 성공하면 최근추가된곡·내가추천한곡 쿼리 캐시 맨 앞에 바로 얹어서 즉시 화면에 반영
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitSongUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import {
  MY_SONGS_INFINITE_QUERY_KEY,
  MY_SONGS_QUERY_KEY,
  RECENT_SONGS_INFINITE_QUERY_KEY,
  RECENT_SONGS_QUERY_KEY,
  SONG_CREATION_STATUS_QUERY_KEY,
  prependSongToPagesCache,
} from './playlistQueryKeys.js';

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
      // 장르별 홈 미리보기 캐시는 새 곡이 그 장르인지 여기서 알 수 없으니 얹지 않고 다시 조회하게 표시만 해둠
      queryClient.invalidateQueries({
        queryKey: RECENT_SONGS_QUERY_KEY,
        predicate: (query) => query.queryKey.length > RECENT_SONGS_QUERY_KEY.length,
      });
      // 전체 보기(무한 스크롤) 캐시에도 첫 페이지 맨 앞에 얹음
      prependSongToPagesCache(queryClient, RECENT_SONGS_INFINITE_QUERY_KEY, song);
      prependSongToPagesCache(queryClient, MY_SONGS_INFINITE_QUERY_KEY, song);
      // 홈 "내가 추천한 곡"이 쓰는 캐시 — PlaylistView의 useMySongs는 추천 화면을 열어도 언마운트되지 않아 자동 재조회가 없으므로 직접 갱신.
      // 목록이 아직 없으면(prev undefined) 얹지 않고 진행 중인 최초 조회에 맡김. 등록 직후 응답은 createdAt 등이 불완전할 수 있고
      // size 제한(20)도 있어서, 먼저 낙관적으로 얹은 뒤 재조회로 서버 값에 맞춤
      queryClient.setQueryData<Song[]>(MY_SONGS_QUERY_KEY, (prev) => (prev ? [song, ...prev] : prev));
      queryClient.invalidateQueries({ queryKey: MY_SONGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_SONGS_INFINITE_QUERY_KEY });
    },
    // 성공하면 남은 횟수가 바뀌고, 실패해도(다른 기기에서 한도를 채웠거나 임시 차단이 걸린 경우 등) 등록 가능 상태가
    // 달라졌을 수 있어서 결과와 무관하게 다시 조회 — 화면에 떠 있는 한도/차단 안내가 바로 최신 값으로 바뀜
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SONG_CREATION_STATUS_QUERY_KEY });
    },
  });
}
