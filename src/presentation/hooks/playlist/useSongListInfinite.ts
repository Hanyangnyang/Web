// 훅(ViewModel) 공통: 곡 목록 전체 보기 화면의 무한 스크롤 — 서버가 준 last로 다음 페이지가 있는지 판단해 20개씩 이어 받음.
// 최근추가된곡/저장한곡/내가추천한곡 훅이 "어느 API를 부르는지"만 다르고 나머지는 같아서 여기로 모음
import { useInfiniteQuery } from '@tanstack/react-query';
import type { PlaylistSongPage } from '../../../domain/entities/PlaylistSong.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong } from '../../components/playlist/playlistTypes.js';
import type { SongPage, SongPagesData } from './playlistQueryKeys.js';

export const SONG_LIST_PAGE_SIZE = 20;

// 모듈 레벨로 둬서 참조가 고정 — data가 같으면 react-query가 select 결과(이어 붙인 배열)를 재사용함
const flattenSongs = (data: SongPagesData) => data.pages.flatMap((page) => page.songs);

interface UseSongListInfiniteParams {
  queryKey: readonly unknown[];
  fetchPage: (params: { deviceId: string; page: number; size: number }) => Promise<PlaylistSongPage>;
}

export function useSongListInfinite({ queryKey, fetchPage }: UseSongListInfiniteParams) {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<SongPage> => {
      const deviceId = await getOrCreateAnonymousUserId();
      const { songs, last } = await fetchPage({ deviceId, page: pageParam, size: SONG_LIST_PAGE_SIZE });
      return { songs: songs.map(mapPlaylistSongToSong), last };
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.last ? undefined : allPages.length),
    select: flattenSongs,
    staleTime: 0,
  });

  return {
    songs: query.data,
    isLoading: query.isLoading,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
