// 훅(ViewModel): 검색 결과 화면의 "게시글" 섹션 — 제목/가수명/코멘트 가중치 통합 검색
import { useQuery } from '@tanstack/react-query';
import { searchSongsUseCase } from '../../../di.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song } from '../../components/playlist/playlistTypes.js';
import { SONG_SEARCH_MIN_LENGTH } from './playlistQueryKeys.js';

const SONG_SEARCH_SIZE = 20;

export function useSongSearch(keyword: string) {
  const trimmed = keyword.trim();

  return useQuery<Song[]>({
    queryKey: ['playlist', 'song-search', trimmed],
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await searchSongsUseCase.execute({ keyword: trimmed, deviceId, size: SONG_SEARCH_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    enabled: trimmed.length >= SONG_SEARCH_MIN_LENGTH,
    staleTime: 0,
  });
}
