// 도메인 엔티티: Spotify 곡 검색 결과 한 곡 (Vercel BFF /api/music-search)
export interface MusicSearchTrack {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

// /api/music-search가 429(요청 제한)로 응답할 때 Retry-After 헤더를 실어 보내는 에러 —
// 곡추천하기/검색결과 화면이 이 값으로 재시도 대기 UX(버튼 비활성화 등)를 보여줌
export interface MusicSearchRateLimitError extends Error {
  statusCode: number;
  retryAfterSeconds?: number;
}
