const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = { token: null, expiresAt: 0 };
const trackCache = new Map(); // 트랙 검색 결과 캐시

async function getSpotifyAccessToken() {
  const now = Date.now();
  if (cachedToken.token && now < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  console.log('[Spotify Auth] Requesting access token...');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  console.log('[Spotify Auth] Token response status:', response.status);
  if (!response.ok) {
    const errorBody = await response.text();
    console.log('[Spotify Auth] Error body:', errorBody);
    throw new Error(`Spotify auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in * 1000)
  };

  return data.access_token;
}

async function searchSpotifyTrack(title, artist) {
  const token = await getSpotifyAccessToken();
  const query = `${title} ${artist}`;
  const encodedQuery = encodeURIComponent(query);

  console.log('[Spotify Search] Searching for:', query);
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=1`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  console.log('[Spotify Search] Search response status:', response.status);
  if (!response.ok) {
    const errorBody = await response.text();
    console.log('[Spotify Search] Error body:', errorBody);
    throw new Error(`Spotify search failed: ${response.statusText}`);
  }

  const data = await response.json();
  const track = data.tracks.items[0];

  if (!track) {
    throw new Error(`No track found for: ${title} - ${artist}`);
  }

  return {
    id: track.id,
    title: track.name,
    artist: track.artists[0]?.name || 'Unknown',
    imageUrl: track.album.images[0]?.url || null,
    previewUrl: track.preview_url || null,
    embedUrl: `https://open.spotify.com/embed/track/${track.id}`,
    uri: track.uri
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, artist } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ error: 'title and artist query params required' });
  }

  const cacheKey = `${title}||${artist}`;

  // 캐시 확인
  if (trackCache.has(cacheKey)) {
    console.log('[Music API] Cache hit for:', cacheKey);
    return res.status(200).json(trackCache.get(cacheKey));
  }

  console.log('[Music API Debug]', { clientId: !!clientId, clientSecret: !!clientSecret });

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Spotify credentials not configured',
      debug: { clientId: clientId ? 'exists' : 'missing', clientSecret: clientSecret ? 'exists' : 'missing' }
    });
  }

  try {
    const trackData = await searchSpotifyTrack(title, artist);
    // 캐시에 저장
    trackCache.set(cacheKey, trackData);
    res.status(200).json(trackData);
  } catch (error) {
    console.error('Music API error:', error);
    res.status(500).json({ error: error.message });
  }
}
