import { describe, it, expect } from 'vitest';
import { createMusicSearchRepository } from './MusicSearchRepository.js';
import type { MusicSearchApiDataSource } from '../datasources/MusicSearchApiDataSource.js';
import type { ApiResponse } from '../../infrastructure/http/HttpClient.js';

const URL_ = 'https://api.example.com/api/v1/playlist/catalog/tracks/search?keyword=aa';

const repoWith = (res: ApiResponse<unknown>) =>
  createMusicSearchRepository({
    musicSearchApiDataSource: { search: async () => res } as MusicSearchApiDataSource,
  });

const validTrack = { trackId: 't1', title: '곡', artist: '가수', albumArtUrl: 'https://img', recommendationCount: 2 };

describe('MusicSearchRepository.search', () => {
  it('정상 응답이면 곡 배열을 그대로 돌려준다', async () => {
    const repo = repoWith({ success: true, data: { tracks: [validTrack] }, _requestUrl: URL_ });
    await expect(repo.search('aa')).resolves.toEqual([validTrack]);
  });

  it('결과가 비어 있으면 빈 배열(에러 아님)을 돌려준다', async () => {
    const repo = repoWith({ success: true, data: { tracks: [] }, _requestUrl: URL_ });
    await expect(repo.search('aa')).resolves.toEqual([]);
  });

  it('trackId 등 필수 필드가 없는 곡만 걸러내고 나머지는 살린다', async () => {
    const repo = repoWith({
      success: true,
      data: { tracks: [validTrack, { title: 'trackId 없음', artist: 'x' }, { ...validTrack, trackId: '' }, null, 'bad'] },
      _requestUrl: URL_,
    });
    await expect(repo.search('aa')).resolves.toEqual([validTrack]);
  });

  it('없어도 화면이 깨지지 않는 필드는 기본값으로 채운다', async () => {
    const repo = repoWith({
      success: true,
      data: { tracks: [{ trackId: 't2', title: '곡', artist: '가수', recommendationCount: 'many' }] },
      _requestUrl: URL_,
    });
    await expect(repo.search('aa')).resolves.toEqual([{ trackId: 't2', title: '곡', artist: '가수', albumArtUrl: '', recommendationCount: 0 }]);
  });

  it('success:false면 area/endpoint가 붙은 에러를 던진다', async () => {
    const repo = repoWith({ success: false, data: null, error: { code: 'X', message: '서버 실패' }, _requestUrl: URL_ });
    await expect(repo.search('aa')).rejects.toMatchObject({ message: '서버 실패', area: '곡검색', endpoint: URL_ });
  });

  it('tracks가 배열이 아니면 "결과 없음"으로 감추지 않고 에러를 던진다', async () => {
    const repo = repoWith({ success: true, data: { tracks: 'oops' }, _requestUrl: URL_ });
    await expect(repo.search('aa')).rejects.toMatchObject({ area: '곡검색', endpoint: URL_ });
  });

  it('data 자체가 비어 있어도 에러를 던진다', async () => {
    const repo = repoWith({ success: true, data: null, _requestUrl: URL_ });
    await expect(repo.search('aa')).rejects.toMatchObject({ area: '곡검색' });
  });

  it('데이터소스가 던진 HTTP 에러에도 area 태그가 붙는다', async () => {
    const repo = createMusicSearchRepository({
      musicSearchApiDataSource: { search: async () => { throw Object.assign(new Error('제한'), { statusCode: 429 }); } } as MusicSearchApiDataSource,
    });
    await expect(repo.search('aa')).rejects.toMatchObject({ statusCode: 429, area: '곡검색' });
  });
});
