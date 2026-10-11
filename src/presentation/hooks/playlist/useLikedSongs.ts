// 훅(ViewModel): 저장한 곡 화면용 — 20개씩 이어 받는 무한 스크롤
import { getLikedSongsUseCase } from '../../../di.js';
import { LIKED_SONGS_QUERY_KEY } from './playlistQueryKeys.js';
import { useSongListInfinite } from './useSongListInfinite.js';

export function useLikedSongs() {
  return useSongListInfinite({
    queryKey: LIKED_SONGS_QUERY_KEY,
    fetchPage: (params) => getLikedSongsUseCase.execute(params),
  });
}
