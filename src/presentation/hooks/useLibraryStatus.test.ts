import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { queryClient } from '../../lib/queryClient.js';
import { useLibraryStatus, prefetchLibraryStatus } from './useLibraryStatus.js';

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

function makeLibraryApiResponse() {
  return {
    success: true,
    data: {
      readingRooms: [
        { room: 'FIRST_READING_ROOM', roomName: '제1열람실', totalSeat: 100, availableSeats: 70, occupiedSeats: 30 },
        { room: 'SECOND_READING_ROOM', roomName: '제2열람실', totalSeat: 80, availableSeats: 20, occupiedSeats: 60 },
      ],
      updatedAt: '2026-08-12 14:27:00',
    },
  };
}

describe('useLibraryStatus (React Query)', () => {
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

    const { result } = renderHook(() => useLibraryStatus(true), { wrapper });

    expect(result.current.library).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('fetch에 성공하면 열람실 목록이 반영된다', async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, makeLibraryApiResponse())));

    const { result } = renderHook(() => useLibraryStatus(true), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.library?.list).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('쿼리 캐시에 이미 신선한 데이터가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', () => {
    queryClient.setQueryData(['portal', 'library'], { list: [{ id: 'FIRST_READING_ROOM', name: '캐시된 열람실' }] });

    const fetchSpy = mockFetch(() => new Promise(() => {}));

    const { result } = renderHook(() => useLibraryStatus(true), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.library!.list[0].name).toBe('캐시된 열람실');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('재요청이 실패해도 이전에 받은 데이터가 그대로 유지된다', async () => {
    queryClient.setQueryData(['portal', 'library'], { list: [{ id: 'FIRST_READING_ROOM', name: '이전 열람실' }] });

    mockFetch(() => Promise.resolve(jsonResponse(false, null)));

    const { result } = renderHook(() => useLibraryStatus(true), { wrapper });

    // 캐시가 있어 처음엔 재요청을 안 하므로, 명시적으로 무효화해 재검증을 유도
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['portal', 'library'] });
    });

    // 재요청이 실패하면 react-query 기본 재시도(최대 3회, ~7초 지수 백오프)를 실제로 거치므로 여유 있게 대기
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 10000 });
    // 실패했으니 react-query 기본 동작대로 이전 데이터가 지워지지 않고 남아있어야 함
    // (카드가 error와 library를 함께 보고 "이전 데이터 유지"를 판단하는 근거)
    expect(result.current.library!.list[0].name).toBe('이전 열람실');
    expect(result.current.error).not.toBeNull();
  }, 15000);

  it('같은 훅을 쓰는 컴포넌트 두 개가 동시에 마운트돼도 fetch는 한 번만 나가고 데이터를 공유한다', async () => {
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, makeLibraryApiResponse())));

    const first = renderHook(() => useLibraryStatus(true), { wrapper });
    const second = renderHook(() => useLibraryStatus(true), { wrapper });

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.result.current.library?.list).toHaveLength(2);
    expect(second.result.current.library?.list).toHaveLength(2);
  });

  it('prefetchLibraryStatus()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (react-query 요청 dedup)', async () => {
    const fetchMock = mockFetch(() => Promise.resolve(jsonResponse(true, makeLibraryApiResponse())));

    await Promise.all([prefetchLibraryStatus(), prefetchLibraryStatus()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('isActive=false면 쿼리가 비활성화되어 fetch가 나가지 않는다', () => {
    const fetchSpy = mockFetch(() => new Promise(() => {}));

    renderHook(() => useLibraryStatus(false), { wrapper });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
