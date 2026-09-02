// 데이터 소스: Spotify 곡 검색 Vercel BFF(/api/music-search) 원시 호출.
// 새 백엔드(api.hanyang.life)와 응답 봉투가 달라서({tracks:[...]} vs {success,data,error}) parseOrThrow를 안 씀
import type { HttpClient } from '../../infrastructure/http/HttpClient.js';
import type { MusicSearchTrack, MusicSearchRateLimitError } from '../../domain/entities/MusicSearchTrack.js';

export interface MusicSearchApiDataSource {
  search: (query: string) => Promise<MusicSearchTrack[]>;
}

export const createMusicSearchApiDataSource = ({ httpClient }: { httpClient: HttpClient }): MusicSearchApiDataSource => ({
  search: async (query) => {
    const response = await httpClient.get(`/api/music-search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const retryAfterHeader = response.headers.get('Retry-After');
      const err = new Error(body?.error || '검색 중 문제가 생겼어요. 다시 시도해주세요.') as MusicSearchRateLimitError;
      err.statusCode = response.status;
      if (retryAfterHeader) err.retryAfterSeconds = Number(retryAfterHeader);
      throw err;
    }

    const data = await response.json();
    return (data.tracks ?? []) as MusicSearchTrack[];
  },
});
