import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { usePortalData, prefetchPortalData } from './usePortalData.js';

// usePortalData/useBanners가 공유하는 전역 QueryClient를 그대로 사용 (프로덕션과 동일 인스턴스).
// 테스트 간 캐시가 새지 않도록 매 테스트 전에 queryClient.clear()로 초기화한다.
function wrapper({ children }) {
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function jsonResponse(ok, data) {
  return { ok, json: async () => data };
}

function makeWeatherMock(overrides = {}) {
  return { temp: 20, hourlyForecast: [], ...overrides };
}

function makeLibraryApiResponse() {
  return {
    success: true,
    data: {
      list: [
        { id: 61, name: '제1열람실', seats: { total: 100, occupied: 30 } },
        { id: 63, name: '제2열람실', seats: { total: 80, occupied: 60 } },
      ],
    },
  };
}

function createDeferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

describe('usePortalData (React Query)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('캐시가 전혀 없으면 weather/library 모두 로딩 상태로 시작한다', () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // 응답 없이 계속 대기

    const { result } = renderHook(() => usePortalData(true), { wrapper });

    expect(result.current.weather).toBeNull();
    expect(result.current.library).toBeNull();
    expect(result.current.weatherLoading).toBe(true);
    expect(result.current.libraryLoading).toBe(true);
  });

  it('날씨가 도서관보다 먼저 도착하면 weatherLoading만 먼저 꺼지고 libraryLoading은 유지된다', async () => {
    const weatherDeferred = createDeferred();
    const libraryDeferred = createDeferred();

    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return weatherDeferred.promise;
      if (url.includes('type=library')) return libraryDeferred.promise;
      throw new Error(`unexpected url: ${url}`);
    });

    const { result } = renderHook(() => usePortalData(true), { wrapper });

    expect(result.current.weatherLoading).toBe(true);
    expect(result.current.libraryLoading).toBe(true);

    // 날씨만 먼저 응답
    await act(async () => {
      weatherDeferred.resolve(jsonResponse(true, makeWeatherMock()));
    });

    await waitFor(() => expect(result.current.weatherLoading).toBe(false));
    expect(result.current.weather).not.toBeNull();
    // 이 테스트의 핵심: 도서관은 아직 응답 전이라 계속 로딩 중이어야 함 (독립 쿼리이므로 서로 안 막음)
    expect(result.current.libraryLoading).toBe(true);
    expect(result.current.library).toBeNull();

    // 도서관도 응답
    await act(async () => {
      libraryDeferred.resolve(jsonResponse(true, makeLibraryApiResponse()));
    });

    await waitFor(() => expect(result.current.libraryLoading).toBe(false));
    expect(result.current.library?.list).toHaveLength(2);
  });

  it('쿼리 캐시에 이미 신선한 데이터가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', () => {
    queryClient.setQueryData(['portal', 'weather'], makeWeatherMock());
    queryClient.setQueryData(['portal', 'library'], { list: [{ id: 61, name: '캐시된 열람실' }] });

    const fetchSpy = vi.fn(() => new Promise(() => {}));
    global.fetch = fetchSpy;

    const { result } = renderHook(() => usePortalData(true), { wrapper });

    expect(result.current.weatherLoading).toBe(false);
    expect(result.current.libraryLoading).toBe(false);
    expect(result.current.library.list[0].name).toBe('캐시된 열람실');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('도서관 재요청이 실패해도 이전에 받은 도서관 데이터가 그대로 유지된다', async () => {
    queryClient.setQueryData(['portal', 'library'], { list: [{ id: 61, name: '이전 열람실' }] });

    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return Promise.resolve(jsonResponse(true, makeWeatherMock()));
      if (url.includes('type=library')) return Promise.resolve(jsonResponse(false, null));
      throw new Error(`unexpected url: ${url}`);
    });

    const { result } = renderHook(() => usePortalData(true), { wrapper });

    // 캐시가 있어 처음엔 재요청을 안 하므로, 명시적으로 무효화해 재검증을 유도
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['portal', 'library'] });
    });

    // 재요청이 실패하면 react-query 기본 재시도(최대 3회, ~7초 지수 백오프)를 실제로 거치므로 여유 있게 대기
    await waitFor(() => expect(result.current.libraryLoading).toBe(false), { timeout: 10000 });
    // 실패했으니 react-query 기본 동작대로 이전 데이터가 지워지지 않고 남아있어야 함
    expect(result.current.library.list[0].name).toBe('이전 열람실');
  }, 15000);

  it('prefetchPortalData()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (react-query 요청 dedup)', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return Promise.resolve(jsonResponse(true, makeWeatherMock()));
      if (url.includes('type=library')) return Promise.resolve(jsonResponse(true, makeLibraryApiResponse()));
      throw new Error(`unexpected url: ${url}`);
    });

    await Promise.all([prefetchPortalData(), prefetchPortalData()]);

    const weatherCalls = global.fetch.mock.calls.filter(([url]) => url.includes('type=weather')).length;
    const libraryCalls = global.fetch.mock.calls.filter(([url]) => url.includes('type=library')).length;
    expect(weatherCalls).toBe(1);
    expect(libraryCalls).toBe(1);
  });

  it('같은 훅을 쓰는 컴포넌트 두 개가 동시에 마운트돼도 fetch는 한 번만 나가고 데이터를 공유한다', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return Promise.resolve(jsonResponse(true, makeWeatherMock()));
      if (url.includes('type=library')) return Promise.resolve(jsonResponse(true, makeLibraryApiResponse()));
      throw new Error(`unexpected url: ${url}`);
    });

    const first = renderHook(() => usePortalData(true), { wrapper });
    const second = renderHook(() => usePortalData(true), { wrapper });

    await waitFor(() => expect(first.result.current.libraryLoading).toBe(false));
    await waitFor(() => expect(second.result.current.libraryLoading).toBe(false));

    const weatherCalls = global.fetch.mock.calls.filter(([url]) => url.includes('type=weather')).length;
    expect(weatherCalls).toBe(1);

    expect(first.result.current.library?.list).toHaveLength(2);
    expect(second.result.current.library?.list).toHaveLength(2);
  });

  it('전부 실패하면 react-query 기본 재시도 정책(최대 3회)만큼 재시도한다', async () => {
    // 주의: queryClient.prefetchQuery()는 react-query 설계상 retry를 명시 안 하면 강제로 retry:false가 되어
    // (fetchQuery 내부에서 그렇게 덮어씀) 재시도가 없다. 재시도는 useQuery로 "관찰 중인" 쿼리에서만 동작하므로,
    // 실제 화면에서 쓰이는 usePortalData 훅(마운트된 컴포넌트)을 기준으로 검증한다.
    vi.useFakeTimers();
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(false, null)));

    renderHook(() => usePortalData(true), { wrapper });

    // react-query 기본 retryDelay: attempt => min(1000 * 2^attempt, 30000) → 1s, 2s, 4s
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    // 최초 1회 + 재시도 3회 = 총 4번 fetch가 나갔어야 함
    const weatherCalls = global.fetch.mock.calls.filter(([url]) => url.includes('type=weather')).length;
    expect(weatherCalls).toBe(4);
  });

  it('prefetchPortalData()(앱 시작 시 백그라운드 프리페치)는 실패해도 재시도하지 않는다', async () => {
    // react-query의 의도된 설계: fetchQuery/prefetchQuery류의 "일회성 호출"은 retry를 명시하지 않으면
    // 자동으로 retry:false가 된다 (호출자를 재시도 지연으로 오래 붙잡지 않기 위함).
    // 실제 재시도는 usePortalData 훅이 마운트되는 시점(사용자가 탭에 들어왔을 때)에 일어난다.
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(false, null)));

    await prefetchPortalData();

    const weatherCalls = global.fetch.mock.calls.filter(([url]) => url.includes('type=weather')).length;
    expect(weatherCalls).toBe(1);
  });

  it('isVisible=false면 쿼리가 비활성화되어 fetch가 나가지 않는다', () => {
    const fetchSpy = vi.fn(() => new Promise(() => {}));
    global.fetch = fetchSpy;

    renderHook(() => usePortalData(false), { wrapper });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
