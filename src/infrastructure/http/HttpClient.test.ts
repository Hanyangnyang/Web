import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHttpClient, parseOrThrow } from './HttpClient';

describe('createHttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))));
  });

  it('handles baseUrl without trailing slash and path with leading slash', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', { headers: {} });
  });

  it('strips trailing slash from baseUrl when path starts with slash (prevents double slash //)', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life/' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', { headers: {} });
  });

  it('handles baseUrl with multiple trailing slashes', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life///' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', { headers: {} });
  });

  it('ensures slash when path does not start with slash', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life' });
    await client.get('api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/subway/schedule', { headers: {} });
  });

  it('works correctly with empty baseUrl', async () => {
    const client = createHttpClient({ baseUrl: '' });
    await client.get('/api/v1/subway/schedule');
    expect(fetch).toHaveBeenCalledWith('/api/v1/subway/schedule', { headers: {} });
  });

  it('works correctly with post requests', async () => {
    const client = createHttpClient({ baseUrl: 'https://api.hanyang.life/' });
    await client.post('/api/v1/feedback', { text: 'test' });
    expect(fetch).toHaveBeenCalledWith('https://api.hanyang.life/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test' }),
    });
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
