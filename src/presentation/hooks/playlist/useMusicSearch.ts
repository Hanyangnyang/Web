// 훅(ViewModel): 곡추천하기/검색결과 화면의 곡(Spotify) 검색 — 429(요청 제한) 등 실패 시 자체 백오프
// UX(버튼 비활성화)를 호출부가 직접 만들므로, react-query의 기본 자동 재시도(defaultOptions.queries.retry: 2)는 꺼둠
import { useQuery } from '@tanstack/react-query';
import { searchMusicTracksUseCase } from '../../../di.js';
import type { MusicSearchTrack, MusicSearchRateLimitError } from '../../../domain/entities/MusicSearchTrack.js';
import { SONG_SEARCH_MIN_LENGTH } from './playlistQueryKeys.js';

const MUSIC_SEARCH_STALE_TIME_MS = 60 * 1000;

// 연속 공백은 한 칸으로 접어서, 같은 의미의 검색어가 다른 캐시 키로 흩어지는 걸 막음
// 호출부가 "지금 검색어와 같은 검색어인지" 비교할 때도 이 값을 씀
export const normalizeMusicSearchQuery = (query: string) => query.trim().replace(/\s+/g, ' ');

export function useMusicSearch(query: string) {
  const trimmed = normalizeMusicSearchQuery(query);

  return useQuery<MusicSearchTrack[], MusicSearchRateLimitError>({
    queryKey: ['playlist', 'music-search', trimmed],
    queryFn: () => searchMusicTracksUseCase.execute(trimmed),
    enabled: trimmed.length >= SONG_SEARCH_MIN_LENGTH,
    staleTime: MUSIC_SEARCH_STALE_TIME_MS,
    retry: false,
  });
}
