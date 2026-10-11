import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { SongCreationStatus } from '../../../domain/entities/SongCreationStatus.js';
import { SONG_CREATION_STATUS_QUERY_KEY } from './playlistQueryKeys.js';

const execute = vi.fn();
vi.mock('../../../di.js', () => ({ getSongCreationStatusUseCase: { execute: (...args: unknown[]) => execute(...args) } }));
vi.mock('../../../lib/supabase.js', () => ({ getOrCreateAnonymousUserId: async () => 'device-1' }));

import { useSongCreationStatus } from './useSongCreationStatus.js';

const status = (over: Partial<SongCreationStatus> = {}): SongCreationStatus => ({
  canCreate: true,
  dailyCount: 0,
  dailyMaxLimit: 3,
  remainingCount: 3,
  recentTrackIdsIn7Days: [],
  temporarilyBlocked: false,
  blockedUntil: null,
  ...over,
});

// 앱 전역 queryClient는 localStorage 영속화가 붙어 있어서, 테스트마다 새 클라이언트를 쓴다
function setup(seed?: SongCreationStatus) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  if (seed) client.setQueryData(SONG_CREATION_STATUS_QUERY_KEY, seed);
  const wrapper = ({ children }: { children: ReactNode }) => React.createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useSongCreationStatus(), { wrapper });
}

describe('useSongCreationStatus', () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it('서버 응답이 오면 그 값을 돌려준다', async () => {
    execute.mockResolvedValue(status({ remainingCount: 2, dailyCount: 1 }));
    const { result } = setup();

    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data?.remainingCount).toBe(2));
  });

  it('캐시에 남아 있던 어제의 canCreate:false는 재조회 응답이 오기 전까지 노출하지 않는다', async () => {
    let resolveFetch: (s: SongCreationStatus) => void = () => {};
    execute.mockReturnValue(new Promise<SongCreationStatus>((resolve) => { resolveFetch = resolve; }));
    const { result } = setup(status({ canCreate: false, remainingCount: 0 }));

    // 캐시에는 false가 있지만 아직 재조회 전이므로 "확정 전"(undefined) — 한도 팝업이 잠깐 뜨지 않음
    expect(result.current.data).toBeUndefined();

    resolveFetch(status({ canCreate: true }));
    await waitFor(() => expect(result.current.data?.canCreate).toBe(true));
  });

  it('재조회가 실패하면 캐시된 값 대신 undefined와 isError를 돌려준다(막지 않고 진행)', async () => {
    execute.mockRejectedValue(new Error('network'));
    const { result } = setup(status({ canCreate: false }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
