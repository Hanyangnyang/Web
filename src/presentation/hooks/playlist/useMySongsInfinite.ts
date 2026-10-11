// 훅(ViewModel): "내가 추천한 곡" 전체 보기 화면 — 20개씩 이어 받는 무한 스크롤
import { getMySongsUseCase } from '../../../di.js';
import { MY_SONGS_INFINITE_QUERY_KEY } from './playlistQueryKeys.js';
import { useSongListInfinite } from './useSongListInfinite.js';

export function useMySongsInfinite() {
  return useSongListInfinite({
    queryKey: MY_SONGS_INFINITE_QUERY_KEY,
    fetchPage: (params) => getMySongsUseCase.execute(params),
  });
}
