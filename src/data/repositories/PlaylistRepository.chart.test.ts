import { describe, it, expect } from 'vitest';
import { createPlaylistRepository } from './PlaylistRepository.js';
import type { PlaylistApiDataSource } from '../datasources/PlaylistApiDataSource.js';
import type { ApiResponse } from '../../infrastructure/http/HttpClient.js';

const URL_ = 'https://api.example.com/api/v1/playlist/songs/charts?type=RISING&deviceId=x';

const repoWith = (res: ApiResponse<unknown>) =>
  createPlaylistRepository({
    playlistApiDataSource: { getCharts: async () => res } as unknown as PlaylistApiDataSource,
  });

const track = (rank: number, extra: Record<string, unknown> = {}) => ({
  rank,
  trackId: `t${rank}`,
  title: `곡${rank}`,
  artist: '가수',
  albumArtUrl: 'https://img/a.jpg',
  isLiked: false,
  ...extra,
});

const okBody = { chartType: 'RISING', displayTitle: '10.08 19:00 기준 실시간 급상승', tracks: [track(1), track(2, { isLiked: true })] };

describe('PlaylistRepository.getPopularityChart', () => {
  it('정상 응답을 엔티티로 변환한다', async () => {
    const repo = repoWith({ success: true, data: okBody, _requestUrl: URL_ });
    await expect(repo.getPopularityChart({ type: 'RISING', deviceId: 'x' })).resolves.toEqual(okBody);
  });

  it('isLiked가 없는 응답(deviceId 미전송 등)이면 false로 채운다', async () => {
    const { isLiked: _omit, ...noLiked } = track(1);
    const repo = repoWith({ success: true, data: { ...okBody, tracks: [noLiked] }, _requestUrl: URL_ });
    const chart = await repo.getPopularityChart();
    expect(chart.tracks[0].isLiked).toBe(false);
  });

  it('곡이 하나도 없는 차트는 에러가 아니라 빈 차트로 취급한다', async () => {
    const repo = repoWith({ success: true, data: { ...okBody, tracks: [] }, _requestUrl: URL_ });
    await expect(repo.getPopularityChart()).resolves.toMatchObject({ tracks: [] });
  });

  it('필수 필드(rank/trackId)가 깨진 곡만 걸러내고 나머지는 살린다', async () => {
    const broken = [track(1), { ...track(2), trackId: '' }, { ...track(3), rank: 'x' }, track(4)];
    const repo = repoWith({ success: true, data: { ...okBody, tracks: broken }, _requestUrl: URL_ });
    const chart = await repo.getPopularityChart();
    expect(chart.tracks.map((t) => t.rank)).toEqual([1, 4]);
  });

  it('displayTitle이 깨져도 차트는 보여주고 제목만 빈 문자열로 둔다', async () => {
    const repo = repoWith({ success: true, data: { ...okBody, displayTitle: 123 }, _requestUrl: URL_ });
    await expect(repo.getPopularityChart()).resolves.toMatchObject({ displayTitle: '' });
  });

  it('tracks가 배열이 아니면 area/endpoint가 붙은 에러를 던진다', async () => {
    const repo = repoWith({ success: true, data: { ...okBody, tracks: 'oops' }, _requestUrl: URL_ });
    await expect(repo.getPopularityChart()).rejects.toMatchObject({ area: '플레이리스트', endpoint: URL_ });
  });

  it('곡이 있는데 전부 검증에 실패하면 빈 차트로 감추지 않고 에러를 던진다', async () => {
    const repo = repoWith({ success: true, data: { ...okBody, tracks: [{ foo: 1 }, { bar: 2 }] }, _requestUrl: URL_ });
    await expect(repo.getPopularityChart()).rejects.toMatchObject({ area: '플레이리스트', endpoint: URL_ });
  });

  it('success:false면 에러를 던진다', async () => {
    const repo = repoWith({ success: false, data: null, error: { code: 'C001', message: '잘못된 요청' }, _requestUrl: URL_ });
    await expect(repo.getPopularityChart()).rejects.toMatchObject({ message: '잘못된 요청' });
  });
});
