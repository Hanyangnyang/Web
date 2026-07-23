import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// usePortalData.js가 관리하는 localStorage 키 (파일 내부 CACHE_KEY, export 안 되어 있어 리터럴로 동기화)
const CACHE_KEY = 'hyu_portal_cache_v3';

function jsonResponse(ok, data) {
  return { ok, json: async () => data };
}

function makeWeatherMock(overrides = {}) {
  const now = Date.now();
  return {
    hourlyForecast: [
      { epoch: now - 3600000 },
      { epoch: now + 3600000 },
    ],
    temp: 20,
    ...overrides,
  };
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

// 모듈 스코프 변수(memoryCache, listeners, retryCount 등)가 테스트 간에 새는 걸 막기 위해
// 매 테스트마다 모듈을 새로 import한다.
async function loadFreshModule() {
  vi.resetModules();
  return import('./usePortalData.js');
}

describe('usePortalData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('캐시가 전혀 없으면 weather/library 모두 로딩 상태로 시작한다', async () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // 응답 없이 계속 대기
    const { usePortalData } = await loadFreshModule();

    const { result } = renderHook(() => usePortalData(true));

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

    const { usePortalData } = await loadFreshModule();
    const { result } = renderHook(() => usePortalData(true));

    // 초기: 둘 다 로딩
    expect(result.current.weatherLoading).toBe(true);
    expect(result.current.libraryLoading).toBe(true);

    // 날씨만 먼저 응답
    await act(async () => {
      weatherDeferred.resolve(jsonResponse(true, makeWeatherMock()));
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.weatherLoading).toBe(false));
    expect(result.current.weather).not.toBeNull();
    // 이 테스트의 핵심: 도서관은 아직 응답 전이라 계속 로딩 중이어야 함
    expect(result.current.libraryLoading).toBe(true);
    expect(result.current.library).toBeNull();

    // 도서관도 응답
    await act(async () => {
      libraryDeferred.resolve(jsonResponse(true, makeLibraryApiResponse()));
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.libraryLoading).toBe(false));
    expect(result.current.library?.list).toHaveLength(2);
  });

  it('둘 다 성공하면 최신 timestamp로 localStorage에 저장된다', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return Promise.resolve(jsonResponse(true, makeWeatherMock()));
      if (url.includes('type=library')) return Promise.resolve(jsonResponse(true, makeLibraryApiResponse()));
      throw new Error(`unexpected url: ${url}`);
    });

    const { usePortalData } = await loadFreshModule();
    const { result } = renderHook(() => usePortalData(true));

    await waitFor(() => expect(result.current.weatherLoading).toBe(false));
    await waitFor(() => expect(result.current.libraryLoading).toBe(false));

    const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
    expect(saved.weather).toBeTruthy();
    expect(saved.library.list).toHaveLength(2);
    expect(saved.timestamp).toBeGreaterThan(0);
  });

  it('유효한 localStorage 캐시가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', async () => {
    const cached = {
      weather: makeWeatherMock(),
      library: { list: [{ id: 61, name: '캐시된 열람실', total: 50, occupied: 10, ratio: 0.2, status: '쾌적', color: '#2563eb', emoji: '🔵' }], updatedAt: Date.now() },
      timestamp: Date.now(), // 방금 저장된 것처럼 → TTL(15분) 이내
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));

    const fetchSpy = vi.fn(() => new Promise(() => {}));
    global.fetch = fetchSpy;

    const { usePortalData } = await loadFreshModule();
    const { result } = renderHook(() => usePortalData(true));

    // 캐시로 즉시 렌더 → 로딩 스피너 없음
    expect(result.current.weatherLoading).toBe(false);
    expect(result.current.libraryLoading).toBe(false);
    expect(result.current.library.list[0].name).toBe('캐시된 열람실');

    // 캐시가 신선하므로 재요청이 없어야 함
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('두 번째 요청에서 도서관만 실패하면, 첫 번째 요청 때 받은 도서관 데이터가 그대로 유지된다', async () => {
    // renderHook 없이 prefetchPortalData()를 직접 두 번 호출해 병합 로직만 검증한다.
    const { prefetchPortalData } = await loadFreshModule();

    // 1차 호출: 완전 성공 → memoryCache/localStorage에 정상 데이터 저장
    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return Promise.resolve(jsonResponse(true, makeWeatherMock()));
      if (url.includes('type=library')) return Promise.resolve(jsonResponse(true, makeLibraryApiResponse()));
      throw new Error(`unexpected url: ${url}`);
    });
    await prefetchPortalData();

    const afterFirst = JSON.parse(localStorage.getItem(CACHE_KEY));
    expect(afterFirst.library.list[0].name).toBe('제1열람실');

    // 캐시를 TTL(15분) 이상 지난 것처럼 만들어 재요청이 실제로 실행되도록 함
    vi.spyOn(Date, 'now').mockReturnValue(afterFirst.timestamp + 20 * 60 * 1000);

    // 2차 호출: 도서관만 실패
    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return Promise.resolve(jsonResponse(true, makeWeatherMock()));
      if (url.includes('type=library')) return Promise.resolve(jsonResponse(false, null));
      throw new Error(`unexpected url: ${url}`);
    });
    await prefetchPortalData();

    const afterSecond = JSON.parse(localStorage.getItem(CACHE_KEY));
    // 도서관은 실패했으니 1차 때 받은 데이터("제1열람실")가 유지되어야 함
    expect(afterSecond.library.list[0].name).toBe('제1열람실');
    // 날씨는 2차 응답으로 갱신됨
    expect(afterSecond.weather).toBeTruthy();
  });

  it('prefetchPortalData()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (isFetching 중복요청 방지)', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('type=weather')) return Promise.resolve(jsonResponse(true, makeWeatherMock()));
      if (url.includes('type=library')) return Promise.resolve(jsonResponse(true, makeLibraryApiResponse()));
      throw new Error(`unexpected url: ${url}`);
    });

    const { prefetchPortalData } = await loadFreshModule();

    // 동시에 두 번 호출 — 두 번째 호출은 isFetching 플래그에 막혀 아무것도 안 해야 함
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

    const { usePortalData } = await loadFreshModule();

    const first = renderHook(() => usePortalData(true));
    const second = renderHook(() => usePortalData(true));

    await waitFor(() => expect(first.result.current.libraryLoading).toBe(false));
    await waitFor(() => expect(second.result.current.libraryLoading).toBe(false));

    const weatherCalls = global.fetch.mock.calls.filter(([url]) => url.includes('type=weather')).length;
    expect(weatherCalls).toBe(1);

    // listeners 구독 구조 덕분에 두 컴포넌트가 같은 데이터를 공유해서 받는지 확인
    expect(first.result.current.library?.list).toHaveLength(2);
    expect(second.result.current.library?.list).toHaveLength(2);
  });

  it('전부 실패하면 지수 백오프로 재시도하고, 최대 재시도 횟수(5회)를 넘으면 멈춘다', async () => {
    vi.useFakeTimers();

    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(false, null)));

    const { prefetchPortalData } = await loadFreshModule();

    const BASE_RETRY_DELAY = 3000; // usePortalData.js의 BASE_RETRY_DELAY와 동일
    const MAX_RETRIES = 5;         // usePortalData.js의 MAX_RETRIES와 동일

    await prefetchPortalData(); // 최초 시도 (실패) → 3초 뒤 재시도 예약

    // 재시도 1~5회를 지수 백오프 간격(3s, 6s, 12s, 24s, 48s)대로 순서대로 흘려보냄
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await vi.advanceTimersByTimeAsync(BASE_RETRY_DELAY * 2 ** attempt);
    }

    // 최초 1회 + 재시도 5회 = 총 6번 fetch가 나갔어야 함
    const weatherCalls = global.fetch.mock.calls.filter(([url]) => url.includes('type=weather')).length;
    expect(weatherCalls).toBe(MAX_RETRIES + 1);

    // 최대 재시도 횟수를 넘었으니, 시간이 더 지나도 추가 요청이 없어야 함
    global.fetch.mockClear();
    await vi.advanceTimersByTimeAsync(BASE_RETRY_DELAY * 2 ** MAX_RETRIES);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
