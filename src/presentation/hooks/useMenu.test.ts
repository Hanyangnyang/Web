import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { getKSTDate } from '../../utils/kstTime.js';
import { useMenu } from './useMenu.js';

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

function todayDateStrSlash() {
  return getKSTDate().toISOString().split('T')[0].replace(/-/g, '/');
}

function menuApiResponse() {
  return {
    success: true,
    date: todayDateStrSlash(),
    data: [
      { id: 're12', name: '학생식당', menus: [{ type: '중식', menu: '<b>제육볶음</b>', price: '5,000원' }], hasJeyuk: true, available: true, hours: { 중식: '11:30~13:30' } },
      { id: 're15', name: '창업보육센터', menus: [], hasJeyuk: false, available: false, hours: {} },
      { id: 're11', name: '교직원식당', menus: [], hasJeyuk: false, available: false, hours: {} },
      { id: 're13', name: '기숙사식당', menus: [], hasJeyuk: false, available: false, hours: {} },
    ],
  };
}

describe('useMenu (React Query)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('캐시 없이 시작하면 로딩 후 API 응답으로 채워진다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, menuApiResponse())));

    const { result } = renderHook(() => useMenu(), { wrapper });

    expect(result.current.menuLoading).toBe(true);
    expect(result.current.cafes).toEqual([]);

    await waitFor(() => expect(result.current.menuLoading).toBe(false));

    expect(result.current.cafes).toHaveLength(4);
    expect(result.current.cafes[0].name).toBe('학생식당');
  });

  it('쿼리 캐시에 이미 신선한 데이터가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', () => {
    const cached = [
      { id: 're12', name: '학생식당(캐시)', menus: [], hasJeyuk: false, available: false, hours: {} },
    ];
    queryClient.setQueryData(['menu', todayDateStrSlash()], cached);

    const fetchSpy = mockFetch(() => new Promise(() => {}));

    const { result } = renderHook(() => useMenu(), { wrapper });

    expect(result.current.menuLoading).toBe(false);
    expect(result.current.cafes).toEqual(cached);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('changeDate(숫자)는 그만큼 날짜를 이동시킨다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, menuApiResponse())));
    const { result } = renderHook(() => useMenu(), { wrapper });
    await waitFor(() => expect(result.current.menuLoading).toBe(false));

    const before = result.current.menuDate.getTime();
    act(() => { result.current.changeDate(1); });

    expect(result.current.menuDate.getTime() - before).toBe(24 * 60 * 60 * 1000);
  });

  it('changeDate(Date)는 해당 날짜로 바로 이동한다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, menuApiResponse())));
    const { result } = renderHook(() => useMenu(), { wrapper });
    await waitFor(() => expect(result.current.menuLoading).toBe(false));

    const target = new Date('2026-12-25T00:00:00Z');
    act(() => { result.current.changeDate(target); });

    expect(result.current.menuDate.toISOString()).toBe(target.toISOString());
  });

  it('[회귀] 캐시 미스로 시작해도 최초 로딩 완료 후 인접 날짜 prefetch가 실행된다', async () => {
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, menuApiResponse())));

    // testing-library의 waitFor는 실시간 폴링이라 페이크 타이머와 섞으면 어긋나므로,
    // 렌더 시점부터 페이크 타이머를 켜고 advanceTimersByTimeAsync로 직접 진행시킨다.
    vi.useFakeTimers();
    const { result } = renderHook(() => useMenu(), { wrapper });

    // 초기 fetch는 타이머 없이 순수 프로미스 체인이라 0ms 진행만으로 마이크로태스크가 다 풀린다
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.menuLoading).toBe(false);

    const callsAfterInitialLoad = fetchMock.mock.calls.length;

    await act(async () => {
      // prefetch effect: 2초 대기 후 어제~+7일 총 8개 날짜를 500ms 텀으로 순회
      await vi.advanceTimersByTimeAsync(2000 + 8 * 500 + 500);
    });

    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterInitialLoad);
  });
});
