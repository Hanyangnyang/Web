// 훅(ViewModel): 곡추천하기/검색결과 화면의 곡(Spotify) 검색 — 429(요청 제한) 등 실패 시 자체 백오프
// UX(버튼 비활성화)를 호출부가 직접 만들므로, react-query의 기본 자동 재시도(defaultOptions.queries.retry: 2)는 꺼둠
import { useQuery } from '@tanstack/react-query';
import { searchMusicTracksUseCase } from '../../../di.js';
import type { MusicSearchTrack, MusicSearchRateLimitError } from '../../../domain/entities/MusicSearchTrack.js';
import { SONG_SEARCH_MIN_LENGTH } from './playlistQueryKeys.js';

// Spotify 검색 결과는 잠깐 사이에 잘 안 바뀌니, 같은 검색어를 다시 눌러도(예: 곡추천하기에서
// 검색 버튼 연타) 이 시간 안엔 네트워크를 다시 안 태우고 캐시를 그대로 씀
const MUSIC_SEARCH_STALE_TIME_MS = 30 * 1000;

export function useMusicSearch(query: string) {
  // 연속 공백은 한 칸으로 접어서, 같은 의미의 검색어가 다른 캐시 키로 흩어지는 걸 막음
  const trimmed = query.trim().replace(/\s+/g, ' ');

  return useQuery<MusicSearchTrack[], MusicSearchRateLimitError>({
    queryKey: ['playlist', 'music-search', trimmed],
    queryFn: () => searchMusicTracksUseCase.execute(trimmed),
    enabled: trimmed.length >= SONG_SEARCH_MIN_LENGTH,
    staleTime: MUSIC_SEARCH_STALE_TIME_MS,
    retry: false,
  });
}
