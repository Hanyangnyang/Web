// 훅(ViewModel): 홈 "최근 추가된 곡" 미리보기용 — 앞의 10개만 받아옴(전체 목록은 useRecentSongsInfinite)
// genreKey(GENRES의 key, 예: 'indie')를 주면 서버가 그 장르 곡만 골라 앞 5개를 내려줌 — 전체 중 첫 페이지를 클라이언트에서
// 걸러내면 해당 장르 곡이 몇 개 안 남아서. 안 주면 전체(RECENT_SONGS_QUERY_KEY 그대로라 다른 곳에서 쓰는 캐시와 공유)
import { useQuery } from '@tanstack/react-query';
import { getRecentSongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { GENRES, mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { RECENT_SONGS_QUERY_KEY } from './playlistQueryKeys.js';

const RECENT_SONGS_PREVIEW_SIZE = 10; // 전체: 홈 곡 배너가 앞 10개를 씀
const GENRE_RECENT_SONGS_PREVIEW_SIZE = 5; // 장르별: 홈 미리보기 카드 수(PlaylistView의 RECENT_SONGS_LIMIT)와 같음

export function useRecentSongs(genreKey?: string) {
  const genreLabel = genreKey ? GENRES.find((genre) => genre.key === genreKey)?.label : undefined;

  return useQuery<Song[]>({
    queryKey: genreLabel ? [...RECENT_SONGS_QUERY_KEY, genreKey] : RECENT_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const { songs } = await getRecentSongsUseCase.execute({ deviceId, size: genreLabel ? GENRE_RECENT_SONGS_PREVIEW_SIZE : RECENT_SONGS_PREVIEW_SIZE, genre: genreLabel });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: 0,
  });
}
