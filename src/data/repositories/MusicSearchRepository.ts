// 레포지토리: Spotify 곡 검색 응답을 MusicSearchTrack 배열로 변환 — 학식(MenuRepository)과 같은 방어 구조:
// success:false·구조가 잘못된 응답은 apiError로 던져 "검색 결과 없음"과 진짜 장애를 구분하고,
// 배열 안 개별 곡이 이상하면 그 곡만 걸러낸다
import { apiError, withAreaTag } from '../../infrastructure/http/HttpClient.js';
import type { MusicSearchApiDataSource } from '../datasources/MusicSearchApiDataSource.js';
import type { MusicSearchRepository } from '../../domain/repositories/IMusicSearchRepository.js';
import { MusicSearchDataSchema, MusicSearchTrackDtoSchema } from '../schemas/MusicSearchSchema.js';

const AREA = '곡검색'; // Sentry 태그용 — 이 레포지토리가 던지는 모든 검증 에러에 공통으로 붙는 한글 이름표

export const createMusicSearchRepository = (
  { musicSearchApiDataSource }: { musicSearchApiDataSource: MusicSearchApiDataSource }
): MusicSearchRepository => ({
  search: (query) => withAreaTag(AREA, async () => {
    const res = await musicSearchApiDataSource.search(query);
    // 1. success 실패했을 때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `music search API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. data 봉투가 구조적으로 잘못됐으면 Error 반환
    const parsed = MusicSearchDataSchema.safeParse(res.data);
    if (!parsed.success)
      throw apiError(
        `music search API returned invalid shaped 'data': ${parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        { area: AREA, endpoint: res._requestUrl }
      );

    // 3. 곡 하나가 이상하면(trackId 누락 등) 그 곡만 제외
    return parsed.data.tracks
      .map(t => MusicSearchTrackDtoSchema.safeParse(t))
      .filter(r => r.success)
      .map(r => r.data);
  }),
});
