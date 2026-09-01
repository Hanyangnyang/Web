import { getSpotifyAccessToken } from './_lib/spotifyAuth.js';

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;
const S_MAXAGE = 3600; // 1시간 — 동일 검색어 반복 요청은 Vercel Edge가 대신 캐싱해줌

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  const query = (q || '').trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return res.status(400).json({ error: `최소 ${MIN_QUERY_LENGTH}자 이상 입력해주세요!` });
  }

  try {
    const token = await getSpotifyAccessToken();
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=${RESULT_LIMIT}&market=KR`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': 'ko-KR,ko;q=0.9'
        }
      }
    );

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '5';
      console.warn('[Music Search] Rate limited by Spotify, retry after', retryAfter);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: '요청이 많이 몰렸습니다. 잠시 후 다시 검색해주세요!' });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Music Search] Spotify search failed:', response.status, errorBody);
      return res.status(502).json({ error: '검색이 실패했습니다. 다시 시도해주세요.' });
    }

    const data = await response.json();
    const tracks = (data.tracks?.items || []).map((track) => ({
      trackId: track.id,
      title: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      albumArtUrl: track.album.images[0]?.url || ''
    }));

    res.setHeader('Cache-Control', `s-maxage=${S_MAXAGE}, stale-while-revalidate=60`);
    res.status(200).json({ tracks });
  } catch (error) {
    console.error('[Music Search] error:', error);
    res.status(500).json({ error: error.message });
  }
}
