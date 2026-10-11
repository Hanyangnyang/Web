import { describe, it, expect } from 'vitest';
import { createPlaylistRepository } from './PlaylistRepository.js';
import type { PlaylistApiDataSource } from '../datasources/PlaylistApiDataSource.js';
import type { ApiResponse } from '../../infrastructure/http/HttpClient.js';

const URL_ = 'https://api.example.com/api/v1/playlist/songs/creation-status?deviceId=x';

const repoWith = (res: ApiResponse<unknown>) =>
  createPlaylistRepository({
    playlistApiDataSource: { getCreationStatus: async () => res } as unknown as PlaylistApiDataSource,
  });

const okBody = {
  canCreate: true,
  dailyCount: 0,
  dailyMaxLimit: 3,
  remainingCount: 3,
  recentTrackIdsIn7Days: [],
  temporarilyBlocked: false,
  blockedUntil: null,
};

describe('PlaylistRepository.getSongCreationStatus', () => {
  it('실제 서버 응답 모양 그대로 엔티티로 변환한다', async () => {
    const repo = repoWith({ success: true, data: okBody, _requestUrl: URL_ });
    await expect(repo.getSongCreationStatus({ deviceId: 'x' })).resolves.toEqual(okBody);
  });

  it('임시 차단 상태(temporarilyBlocked/blockedUntil)를 그대로 전달한다', async () => {
    const blocked = { ...okBody, canCreate: false, temporarilyBlocked: true, blockedUntil: '2026-10-08T14:30:00+09:00' };
    const repo = repoWith({ success: true, data: blocked, _requestUrl: URL_ });
    await expect(repo.getSongCreationStatus({ deviceId: 'x' })).resolves.toMatchObject({
      canCreate: false,
      temporarilyBlocked: true,
      blockedUntil: '2026-10-08T14:30:00+09:00',
    });
  });

  it('임시 차단 필드가 아직 없는 응답이면 차단 아님으로 취급한다', async () => {
    const legacy = { canCreate: true, dailyCount: 1, dailyMaxLimit: 3, remainingCount: 2, recentTrackIdsIn7Days: ['t1'] };
    const repo = repoWith({ success: true, data: legacy, _requestUrl: URL_ });
    await expect(repo.getSongCreationStatus({ deviceId: 'x' })).resolves.toMatchObject({
      temporarilyBlocked: false,
      blockedUntil: null,
    });
  });

  it('recentTrackIdsIn7Days가 배열이 아니면 빈 배열로 대체해 화면이 터지지 않게 한다', async () => {
    const repo = repoWith({ success: true, data: { ...okBody, recentTrackIdsIn7Days: 'oops' }, _requestUrl: URL_ });
    await expect(repo.getSongCreationStatus({ deviceId: 'x' })).resolves.toMatchObject({ recentTrackIdsIn7Days: [] });
  });

  it('핵심 필드 canCreate가 없으면 기본값으로 감추지 않고 area/endpoint가 붙은 에러를 던진다', async () => {
    const { canCreate: _omit, ...withoutCanCreate } = okBody;
    const repo = repoWith({ success: true, data: withoutCanCreate, _requestUrl: URL_ });
    await expect(repo.getSongCreationStatus({ deviceId: 'x' })).rejects.toMatchObject({ area: '플레이리스트', endpoint: URL_ });
  });

  it('success:false면 에러를 던진다', async () => {
    const repo = repoWith({ success: false, data: null, error: { code: 'C001', message: '잘못된 요청' }, _requestUrl: URL_ });
    await expect(repo.getSongCreationStatus({ deviceId: 'x' })).rejects.toMatchObject({ message: '잘못된 요청' });
  });
});
