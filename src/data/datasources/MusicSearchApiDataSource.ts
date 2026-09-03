// 데이터 소스: Spotify 카탈로그 곡 검색 새 백엔드(/api/v1/playlist/catalog/tracks/search) 원시 호출.
// 표준 {success,data,error} 봉투를 쓰지만, 429 응답의 Retry-After 헤더를 읽어야 해서
// parseOrThrow(응답을 곧장 소비)를 쓰지 않고 상태 코드를 직접 분기한다
import type { HttpClient } from '../../infrastructure/http/HttpClient.js';
import type { MusicSearchTrack, MusicSearchRateLimitError } from '../../domain/entities/MusicSearchTrack.js';

export interface MusicSearchApiDataSource {
  search: (query: string) => Promise<MusicSearchTrack[]>;
}

export const createMusicSearchApiDataSource = ({ httpClient }: { httpClient: HttpClient }): MusicSearchApiDataSource => ({
  search: async (query) => {
    const response = await httpClient.get(`/api/v1/playlist/catalog/tracks/search?keyword=${encodeURIComponent(query)}`);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const retryAfterHeader = response.headers.get('Retry-After');
      const err = new Error(body?.error?.message || '검색 중 문제가 생겼어요. 다시 시도해주세요.') as MusicSearchRateLimitError;
      err.statusCode = response.status;
      if (body?.error?.code) err.code = body.error.code;
      if (retryAfterHeader) err.retryAfterSeconds = Number(retryAfterHeader);
      throw err;
    }

    const data = await response.json();
    return (data.data?.tracks ?? []) as MusicSearchTrack[];
  },
});
