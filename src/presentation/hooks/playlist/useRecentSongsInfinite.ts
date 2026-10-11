// 훅(ViewModel): "최근 추가된 곡" 전체 보기 화면 — 20개씩 이어 받는 무한 스크롤
import { getRecentSongsUseCase } from '../../../di.js';
import { RECENT_SONGS_INFINITE_QUERY_KEY } from './playlistQueryKeys.js';
import { useSongListInfinite } from './useSongListInfinite.js';

export function useRecentSongsInfinite() {
  return useSongListInfinite({
    queryKey: RECENT_SONGS_INFINITE_QUERY_KEY,
    fetchPage: (params) => getRecentSongsUseCase.execute(params),
  });
}
