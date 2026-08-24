import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { getKSTDateUnsafe, toDateKey } from '../../utils/kstTime.js';
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

function menuApiResponse() {
  return {
    success: true,
    data: {
      [toDateKey(getKSTDateUnsafe())]: [
        { cafeteriaCode: 'RE12', name: '학생식당', operatingHours: { 중식: '11:30~13:30' }, menu: [{ id: 1, mealType: 'LUNCH', displayOrder: 0, price: 5000, menuItems: ['제육볶음'], rawMenu: '<b>제육볶음</b> 5,000원' }] },
        { cafeteriaCode: 'RE15', name: '창업보육센터', operatingHours: {}, menu: [] },
        { cafeteriaCode: 'RE11', name: '교직원식당', operatingHours: {}, menu: [] },
        { cafeteriaCode: 'RE13', name: '기숙사식당', operatingHours: {}, menu: [] },
      ],
    },
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
    // 배치 조회도 이미 끝난 상태를 재현 — 그래야 개별 날짜 fetch가 배치 완료를 기다리지 않고
    // 캐시를 바로 신뢰해도 되는 상황이 된다
    queryClient.setQueryData(['menu-period'], true);
    queryClient.setQueryData(['menu', toDateKey(getKSTDateUnsafe())], cached);

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

  it('최초 진입 시 파라미터 없이 배치 조회 한 번만 요청한다', async () => {
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, menuApiResponse())));
    const { result } = renderHook(() => useMenu(), { wrapper });
    await waitFor(() => expect(result.current.menuLoading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).not.toContain('startDate=');
  });

  it('배치 응답에 없는 날짜로 이동하면 그 날짜만 개별 요청한다', async () => {
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, menuApiResponse())));
    const { result } = renderHook(() => useMenu(), { wrapper });
    await waitFor(() => expect(result.current.menuLoading).toBe(false));

    const callsAfterInitialLoad = fetchMock.mock.calls.length;

    // menuApiResponse()의 배치 응답엔 오늘 하루치만 들어있어서, 다른 날짜로 이동하면 확실히 범위 밖이다
    act(() => { result.current.changeDate(10); });
    await waitFor(() => expect(result.current.menuLoading).toBe(false));

    const newCalls = fetchMock.mock.calls.slice(callsAfterInitialLoad);
    expect(newCalls).toHaveLength(1);
    expect(newCalls[0][0]).toContain('startDate=');
  });
});
