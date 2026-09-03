// 레포지토리: Spotify 곡 검색 — 원시 응답을 그대로 통과시키되(이미 도메인 엔티티와 모양이 같음),
// 다른 레포지토리와 동일하게 withAreaTag로 Sentry용 영역 태그를 붙임
import { withAreaTag } from '../../infrastructure/http/HttpClient.js';
import type { MusicSearchApiDataSource } from '../datasources/MusicSearchApiDataSource.js';
import type { MusicSearchRepository } from '../../domain/repositories/IMusicSearchRepository.js';

const AREA = '곡검색';

export const createMusicSearchRepository = (
  { musicSearchApiDataSource }: { musicSearchApiDataSource: MusicSearchApiDataSource }
): MusicSearchRepository => ({
  search: (query) => withAreaTag(AREA, () => musicSearchApiDataSource.search(query)),
});
