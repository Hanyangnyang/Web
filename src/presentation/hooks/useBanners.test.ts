import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { useBanners, prefetchBanners } from './useBanners.js';

function wrapper({ children }: { children: ReactNode }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function jsonResponse(ok: boolean, data: unknown): Response {
  return { ok, json: async () => data } as Response;
}

// global.fetch는 실제 fetch 시그니처로 타입이 잡혀있어서, 목 함수를 그대로 대입하면 구조가 안 맞다고
// 에러가 남. 목 함수 자체(fetchMock)는 원래 타입 그대로 유지해서 .mock.calls를 쓸 수 있게 하고,
// global.fetch에 대입하는 지점에서만 캐스팅한다.
function mockFetch(impl: (url: string) => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function makeBanners() {
  return [
    { id: 1, imageUrl: 'https://example.com/a.png', altText: '', clickUrl: '', displayOrder: 1 },
    { id: 2, imageUrl: 'https://example.com/b.png', altText: '광고 배너', clickUrl: 'https://example.com', displayOrder: 2 },
  ];
}

function bannersResponse(banners = makeBanners()) {
  return { success: true, data: banners };
}

describe('useBanners (React Query)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('캐시가 없으면 loading=true, banners=[]로 시작한다', () => {
    mockFetch(() => new Promise(() => {})); // 응답 없이 계속 대기

    const { result } = renderHook(() => useBanners(), { wrapper });

    expect(result.current.banners).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('fetch 성공 시 배너가 반영된다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, bannersResponse())));

    const { result } = renderHook(() => useBanners(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.banners).toHaveLength(2);
  });

  it('서버가 뒤섞어 보내도 displayOrder 순서대로 정렬해서 돌려준다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, bannersResponse([
      { id: 3, imageUrl: 'https://example.com/c.png', altText: '', clickUrl: '', displayOrder: 30 },
      { id: 1, imageUrl: 'https://example.com/a.png', altText: '', clickUrl: '', displayOrder: 10 },
      { id: 2, imageUrl: 'https://example.com/b.png', altText: '', clickUrl: '', displayOrder: 20 },
    ]))));

    const { result } = renderHook(() => useBanners(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.banners.map((b) => b.id)).toEqual([1, 2, 3]);
  });

  it('쿼리 캐시에 이미 신선한 데이터가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', () => {
    queryClient.setQueryData(['banners'], makeBanners());

    const fetchSpy = mockFetch(() => new Promise(() => {}));

    const { result } = renderHook(() => useBanners(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.banners).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('재요청이 실패해도 loading은 false로 풀리고, 기존 캐시가 화면에 유지된다', async () => {
    queryClient.setQueryData(['banners'], makeBanners());

    mockFetch(() => Promise.resolve(jsonResponse(false, null)));

    const { result } = renderHook(() => useBanners(), { wrapper });

    // 캐시가 있어 처음엔 재요청을 안 하므로, 명시적으로 무효화해 재검증을 유도
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['banners'] });
    });

    // 재요청이 실패하면 react-query 기본 재시도(최대 3회, ~7초 지수 백오프)를 실제로 거치므로 여유 있게 대기
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 10000 });
    // 실패했으니 기존 캐시 배너가 그대로 유지됨 (무한 스켈레톤도 방지됨)
    expect(result.current.banners).toHaveLength(2);
  }, 15000);

  it('캐시도 없는데 fetch까지 실패하면 banners=[]로 정리되고 loading은 false로 풀린다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(false, null)));

    const { result } = renderHook(() => useBanners(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 10000 });
    expect(result.current.banners).toEqual([]);
  }, 15000);

  it('prefetchBanners()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (react-query 요청 dedup)', async () => {
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, bannersResponse())));

    await Promise.all([prefetchBanners(), prefetchBanners()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
