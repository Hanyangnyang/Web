// 훅(ViewModel): "최근 추가된 곡" 목록 — 20개씩 이어 받는 무한 스크롤. 홈 미리보기와 전체 보기 화면이 같은 캐시를 씀
// genreKey(GENRES의 key, 예: 'indie')를 주면 서버가 그 장르 곡만 골라 페이징해서 내려줌 — 전체 목록을 클라이언트에서 걸러내면
// 해당 장르 곡이 페이지마다 몇 개 안 남아서 스켈레톤만 길게 이어지기 때문. 안 주면 전체
import { getRecentSongsUseCase } from '../../../di.js';
import { GENRES } from '../../components/playlist/playlistTypes.js';
import { RECENT_SONGS_INFINITE_QUERY_KEY } from './playlistQueryKeys.js';
import { useSongListInfinite } from './useSongListInfinite.js';

export function useRecentSongsInfinite(genreKey?: string) {
  const genreLabel = genreKey ? GENRES.find((genre) => genre.key === genreKey)?.label : undefined;

  return useSongListInfinite({
    queryKey: genreLabel ? [...RECENT_SONGS_INFINITE_QUERY_KEY, genreKey] : RECENT_SONGS_INFINITE_QUERY_KEY,
    fetchPage: (params) => getRecentSongsUseCase.execute({ ...params, genre: genreLabel }),
  });
}
