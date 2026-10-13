// 훅(ViewModel): "내가 추천한 곡" 전체 보기 화면 — 20개씩 이어 받는 무한 스크롤
import { getMySongsUseCase } from '../../../di.js';
import { MY_SONGS_INFINITE_QUERY_KEY } from './playlistQueryKeys.js';
import { useSongListInfinite } from './useSongListInfinite.js';

// enabled: 최근 추가된 곡 화면의 "내 추천" 칩처럼 켰을 때만 받을 때 false로 넘김
export function useMySongsInfinite(enabled = true) {
  return useSongListInfinite({
    queryKey: MY_SONGS_INFINITE_QUERY_KEY,
    fetchPage: (params) => getMySongsUseCase.execute(params),
    enabled,
  });
}
