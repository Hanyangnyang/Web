import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// useBanners.js가 관리하는 localStorage 키 (파일 내부 CACHE_KEY, export 안 되어 있어 리터럴로 동기화)
const CACHE_KEY = 'hyu_banners_cache_v1';

function jsonResponse(ok, data) {
  return { ok, json: async () => data };
}

function makeBanners() {
  return [
    { id: 1, image_url: 'https://example.com/a.png', click_url: null },
    { id: 2, image_url: 'https://example.com/b.png', click_url: 'https://example.com' },
  ];
}

// 모듈 스코프 변수(memoryCache, listeners 등)가 테스트 간에 새는 걸 막기 위해
// 매 테스트마다 모듈을 새로 import한다.
async function loadFreshModule() {
  vi.resetModules();
  return import('./useBanners.js');
}

describe('useBanners', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('캐시가 없으면 loading=true, banners=[]로 시작한다', async () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // 응답 없이 계속 대기
    const { useBanners } = await loadFreshModule();

    const { result } = renderHook(() => useBanners(true));

    expect(result.current.banners).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('fetch 성공 시 배너가 반영되고 localStorage에 저장된다', async () => {
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(true, { banners: makeBanners() })));
    const { useBanners } = await loadFreshModule();

    const { result } = renderHook(() => useBanners(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.banners).toHaveLength(2);

    const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
    expect(saved.banners).toHaveLength(2);
    expect(saved.timestamp).toBeGreaterThan(0);
  });

  it('유효한 localStorage 캐시가 있으면 즉시 그 데이터로 렌더되고 fetch를 하지 않는다', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ banners: makeBanners(), timestamp: Date.now() }));

    const fetchSpy = vi.fn(() => new Promise(() => {}));
    global.fetch = fetchSpy;

    const { useBanners } = await loadFreshModule();
    const { result } = renderHook(() => useBanners(true));

    expect(result.current.loading).toBe(false);
    expect(result.current.banners).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetch가 실패해도 loading은 false로 풀리고, 기존 캐시가 있으면 화면에 유지된다', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ banners: makeBanners(), timestamp: Date.now() - 25 * 60 * 60 * 1000 })); // TTL(24시간) 초과 → 재검증 대상

    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(false, null)));
    const { useBanners } = await loadFreshModule();

    const { result } = renderHook(() => useBanners(true));

    // 재검증 도중엔 기존 캐시가 그대로 화면에 남아있어야 함 (loading=false 유지)
    expect(result.current.loading).toBe(false);
    expect(result.current.banners).toHaveLength(2);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    // 실패 후에도 loading이 계속 false여야 함 (무한 스켈레톤 방지)
    expect(result.current.loading).toBe(false);
    // 실패했으니 기존 캐시 배너가 그대로 유지됨
    expect(result.current.banners).toHaveLength(2);
  });

  it('캐시도 없는데 fetch까지 실패하면 banners=[]로 정리되고 loading은 false로 풀린다', async () => {
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(false, null)));
    const { useBanners } = await loadFreshModule();

    const { result } = renderHook(() => useBanners(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.banners).toEqual([]);
  });

  it('isVisible=false면 캐시가 만료돼도 재요청하지 않는다', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ banners: makeBanners(), timestamp: Date.now() - 25 * 60 * 60 * 1000 }));

    const fetchSpy = vi.fn(() => new Promise(() => {}));
    global.fetch = fetchSpy;

    const { useBanners } = await loadFreshModule();
    renderHook(() => useBanners(false));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('prefetchBanners()를 동시에 두 번 호출해도 실제 fetch는 한 번만 나간다 (isFetching 중복요청 방지)', async () => {
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse(true, { banners: makeBanners() })));
    const { prefetchBanners } = await loadFreshModule();

    // 동시에 두 번 호출 — 두 번째 호출은 isFetching 플래그에 막혀 아무것도 안 해야 함
    await Promise.all([prefetchBanners(), prefetchBanners()]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
