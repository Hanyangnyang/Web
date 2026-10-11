import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHttpClient, parseOrThrow, isTimeoutError } from './HttpClient';

describe('createHttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))));
  });

  it('handles baseUrl without trailing slash and path with leading slash', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', expect.objectContaining({ headers: {} }));
  });

  it('strips trailing slash from baseUrl when path starts with slash (prevents double slash //)', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life/' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', expect.objectContaining({ headers: {} }));
  });

  it('handles baseUrl with multiple trailing slashes', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life///' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', expect.objectContaining({ headers: {} }));
  });

  it('ensures slash when path does not start with slash', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life' });
    await client.get('api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', expect.objectContaining({ headers: {} }));
  });

  it('works correctly with empty baseUrl', async () => {
    const client = createHttpClient({ baseUrl: '' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('/api/v1/subway/schedule', expect.objectContaining({ headers: {} }));
  });

  it('works correctly with post requests', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life/' });
    await client.post('/api/v1/feedback', { text: 'test' });
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/feedback', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    }));
  });

  // 서버가 응답 없이 멈춰도 로딩이 끝나야 한다 — 15초가 지나면 요청을 끊고 TimeoutError로 던진다
  it('aborts and throws TimeoutError when the server does not respond', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })));
      const client = createHttpClient({ baseUrl: 'https://api.hanyang.life' });
      const request = client.get('/api/v1/menu');
      const assertion = expect(request).rejects.toSatisfy((e: unknown) => isTimeoutError(e));
      await vi.advanceTimersByTimeAsync(15_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('parseOrThrow', () => {
  // 캠퍼스맵 건물/흡연장은 {success,data,error} 봉투가 아니라 정적 JSON 배열을 그대로 서빙한다.
  // 배열을 객체처럼 스프레드하면 숫자 키 객체로 뒤바뀌어 .map()/.filter()가 깨진다 — 이 회귀를 고정한다.
  it('returns array responses unmodified (does not mangle them into a keyed object)', async () => {
    const payload = [{ id: 'a' }, { id: 'b' }];
    const res = new Response(JSON.stringify(payload));
    const result = await parseOrThrow(res);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(payload);
  });

  it('attaches _requestUrl to object (backend envelope) responses', async () => {
    const res = new Response(JSON.stringify({ success: true, data: { foo: 'bar' } }));
    const result = await parseOrThrow(res);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ foo: 'bar' });
    expect(typeof result._requestUrl).toBe('string');
  });
});
