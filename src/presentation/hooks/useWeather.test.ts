import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { useWeather, prefetchWeather } from './useWeather.js';
import type { Weather } from '../../domain/entities/Weather.js';

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

// fetch가 돌려주는 서버 응답(DTO) 모양. Repository가 이걸 엔티티로 옮긴다.
function makeWeatherApiResponse() {
  return {
    success: true,
    data: {
      current: {
        forecastAt: '2026-08-13T23:00:00',
        temperature: 20,
        humidity: 50,
        weatherCondition: 'SUNNY',
        precipitation: 0,
        pm10Value: 16,
        pm10Grade: 1,
        pm25Value: 4,
        pm25Grade: 1,
        uvIndex: 0,
        maxTemperature: 30,
        minTemperature: 18,
      },
      hourly: [],
    },
  };
}

// 이쪽은 캐시에 직접 넣는 용도라 DTO가 아니라 엔티티 모양이어야 한다
function makeWeatherMock({ temp = 20 } = {}): Weather {
  return {
    current: {
      epoch: 1786629600000,
      temp,
      condition: 'SUNNY',
      maxTemp: 30,
      minTemp: 18,
      pm10Grade: '좋음',
      pm25Grade: '좋음',
      uvGrade: '낮음',
    },
    hourly: [],
  };
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
    mockFetch(() => Promise.resolve(jsonResponse(true, makeWeatherApiResponse())));

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
    expect(result.current.weather!.current.temp).toBe(7);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('실패하면 queryClient에 설정된 재시도 정책(retry: 2)만큼 재시도한다', async () => {
    // queryClient.ts의 defaultOptions.queries.retry: 2 (기본값 3에서 축소된 값, 0da832e)
    vi.useFakeTimers();
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(false, null)));

    renderHook(() => useWeather(true), { wrapper });

    // react-query 기본 retryDelay: attempt => min(1000 * 2^attempt, 30000) → 1s, 2s (재시도 2회분)
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);

    // 최초 1회 + 재시도 2회 = 총 3번 fetch가 나갔어야 함
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('prefetchWeather()(앱 시작 시 백그라운드 프리페치)도 queryClient의 전역 retry 설정을 따른다', async () => {
    // prefetchQuery는 useQuery와 같은 QueryClient의 defaultOptions.queries.retry를 그대로 상속한다
    // (fetchQuery/prefetchQuery가 retry를 강제로 false로 덮어쓰지 않음 — 별도로 retry:false를 넘길 때만 안 함)
    vi.useFakeTimers();
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(false, null)));

    const prefetchPromise = prefetchWeather();
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await prefetchPromise;

    // 최초 1회 + 재시도 2회 = 총 3번
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('prefetchWeather()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (react-query 요청 dedup)', async () => {
    // makeWeatherApiResponse()가 실제 fetch 응답(DTO, {success, data}) 모양 — makeWeatherMock()은
    // 엔티티 모양이라 여기 쓰면 res.success가 undefined가 되어 apiError가 던져지고 재시도가 돎(과거 버그)
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, makeWeatherApiResponse())));

    await Promise.all([prefetchWeather(), prefetchWeather()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('isVisible=false면 쿼리가 비활성화되어 fetch가 나가지 않는다', () => {
    const fetchSpy = mockFetch(() => new Promise(() => {}));

    renderHook(() => useWeather(false), { wrapper });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
