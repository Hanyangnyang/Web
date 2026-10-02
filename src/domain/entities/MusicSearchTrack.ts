// 도메인 엔티티: Spotify 카탈로그 곡 검색 결과 한 곡 (새 백엔드 /api/v1/playlist/catalog/tracks/search)
export interface MusicSearchTrack {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  // 이 곡에 대해 서비스에 등록된, 삭제되지 않은 추천글 수 — 검색 결과 카드에 "추천글 N개"로 표기
  recommendationCount: number;
}

// 카탈로그 검색 API가 429(요청 제한)로 응답할 때 Retry-After 헤더를 실어 보내는 에러 —
// 곡추천하기/검색결과 화면이 이 값으로 재시도 대기 UX(버튼 비활성화 등)를 보여줌
export interface MusicSearchRateLimitError extends Error {
  statusCode: number;
  code?: string; // C001(검색어 길이) / PL005(요청 제한) / PL004(Spotify 장애)
  retryAfterSeconds?: number;
}
