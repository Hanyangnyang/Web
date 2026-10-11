// 훅(ViewModel): 추천글 검색 "더보기" 화면 — 같은 검색(제목/가수명/코멘트 통합)을 페이지 단위로 이어서 불러옴.
// 서버 응답에서 "다음 페이지가 있는지"를 따로 받지 않으므로, 한 페이지가 가득 찼으면(PAGE_SIZE개) 다음이 있을 수 있다고 보고 이어 받음
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchSongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { SONG_SEARCH_MIN_LENGTH } from './playlistQueryKeys.js';

const PAGE_SIZE = 20;

export function useSongSearchInfinite(keyword: string) {
  const trimmed = keyword.trim();

  return useInfiniteQuery({
    queryKey: ['playlist', 'song-search-pages', trimmed],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Song[]> => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await searchSongsUseCase.execute({ keyword: trimmed, deviceId, page: pageParam, size: PAGE_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length : undefined),
    enabled: trimmed.length >= SONG_SEARCH_MIN_LENGTH,
    staleTime: 0,
  });
}
