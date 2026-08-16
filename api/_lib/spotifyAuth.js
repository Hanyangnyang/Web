const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

let cachedToken = { token: null, expiresAt: 0 };

// Client Credentials Flow: 사용자 로그인 없이 공개 카탈로그(검색·트랙 조회)만 필요할 때 쓰는 앱 단위 인증.
// 토큰을 매 요청마다 새로 받으면 호출 1건이 Spotify 호출 2건(토큰+본 요청)이 되므로 만료 전까지 재사용한다.
export async function getSpotifyAccessToken() {
  const now = Date.now();
  if (cachedToken.token && now < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[Spotify Auth] Token request failed:', response.status, errorBody);
    throw new Error(`Spotify auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in * 1000)
  };

  return data.access_token;
}
