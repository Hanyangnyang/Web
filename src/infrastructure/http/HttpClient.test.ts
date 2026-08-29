import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHttpClient } from './HttpClient';

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
