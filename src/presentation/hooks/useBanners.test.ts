import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { useBanners, prefetchBanners } from './useBanners.js';

function wrapper({ children }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function jsonResponse(ok, data) {
  return { ok, json: async () => data };
}

function makeBanners() {
  return [
    { id: 1, image_url: 'https://example.com/a.png', click_url: null },
    { id: 2, image_url: 'https://example.com/b.png', click_url: 'https://example.com' },
  ];
}

describe('useBanners (React Query)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('캐시가 없으면 loading=true, banners=[]로 시작한다', () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // 응답 없이 계속 대기

    const { result } = renderHook(() => useBanners(true), { wrapper });

    expect(result.current.banners).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('fetch 성공 시 배너가 반영된다', async () => {
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(true, { banners: makeBanners() })));

    const { result } = renderHook(() => useBanners(true), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.banners).toHaveLength(2);
  });

  it('쿼리 캐시에 이미 신선한 데이터가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', () => {
    queryClient.setQueryData(['banners'], makeBanners());

    const fetchSpy = vi.fn(() => new Promise(() => {}));
    global.fetch = fetchSpy;

    const { result } = renderHook(() => useBanners(true), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.banners).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('재요청이 실패해도 loading은 false로 풀리고, 기존 캐시가 화면에 유지된다', async () => {
    queryClient.setQueryData(['banners'], makeBanners());

    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(false, null)));

    const { result } = renderHook(() => useBanners(true), { wrapper });

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
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(false, null)));

    const { result } = renderHook(() => useBanners(true), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 10000 });
    expect(result.current.banners).toEqual([]);
  }, 15000);

  it('isVisible=false면 쿼리가 비활성화되어 fetch가 나가지 않는다', () => {
    const fetchSpy = vi.fn(() => new Promise(() => {}));
    global.fetch = fetchSpy;

    renderHook(() => useBanners(false), { wrapper });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('prefetchBanners()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (react-query 요청 dedup)', async () => {
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(true, { banners: makeBanners() })));

    await Promise.all([prefetchBanners(), prefetchBanners()]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
