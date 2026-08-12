import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { useWeather, prefetchWeather } from './useWeather.js';

// 훅들이 공유하는 전역 QueryClient를 그대로 사용 (프로덕션과 동일 인스턴스).
// 테스트 간 캐시가 새지 않도록 매 테스트 전에 queryClient.clear()로 초기화한다.
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

function makeWeatherMock(overrides = {}) {
  return { temp: 20, hourlyForecast: [], ...overrides };
}

describe('useWeather (React Query)', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('캐시가 전혀 없으면 로딩 상태로 시작한다', () => {
    mockFetch(() => new Promise(() => {})); // 응답 없이 계속 대기

    const { result } = renderHook(() => useWeather(true), { wrapper });

    expect(result.current.weather).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('fetch에 성공하면 날씨가 반영된다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, makeWeatherMock())));

    const { result } = renderHook(() => useWeather(true), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.weather).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('쿼리 캐시에 이미 신선한 데이터가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', () => {
    queryClient.setQueryData(['portal', 'weather'], makeWeatherMock({ temp: 7 }));

    const fetchSpy = mockFetch(() => new Promise(() => {}));

    const { result } = renderHook(() => useWeather(true), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.weather!.temp).toBe(7);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('실패하면 react-query 기본 재시도 정책(최대 3회)만큼 재시도한다', async () => {
    // 주의: queryClient.prefetchQuery()는 react-query 설계상 retry를 명시 안 하면 강제로 retry:false가 되어
    // (fetchQuery 내부에서 그렇게 덮어씀) 재시도가 없다. 재시도는 useQuery로 "관찰 중인" 쿼리에서만 동작하므로,
    // 실제 화면에서 쓰이는 useWeather 훅(마운트된 컴포넌트)을 기준으로 검증한다.
    vi.useFakeTimers();
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(false, null)));

    renderHook(() => useWeather(true), { wrapper });

    // react-query 기본 retryDelay: attempt => min(1000 * 2^attempt, 30000) → 1s, 2s, 4s
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(4000);

    // 최초 1회 + 재시도 3회 = 총 4번 fetch가 나갔어야 함
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('prefetchWeather()(앱 시작 시 백그라운드 프리페치)는 실패해도 재시도하지 않는다', async () => {
    // react-query의 의도된 설계: fetchQuery/prefetchQuery류의 "일회성 호출"은 retry를 명시하지 않으면
    // 자동으로 retry:false가 된다 (호출자를 재시도 지연으로 오래 붙잡지 않기 위함).
    // 실제 재시도는 useWeather 훅이 마운트되는 시점(사용자가 탭에 들어왔을 때)에 일어난다.
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(false, null)));

    await prefetchWeather();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('prefetchWeather()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (react-query 요청 dedup)', async () => {
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, makeWeatherMock())));

    await Promise.all([prefetchWeather(), prefetchWeather()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('isVisible=false면 쿼리가 비활성화되어 fetch가 나가지 않는다', () => {
    const fetchSpy = mockFetch(() => new Promise(() => {}));

    renderHook(() => useWeather(false), { wrapper });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
