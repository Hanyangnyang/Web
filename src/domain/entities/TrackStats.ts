// 도메인 엔티티: 음원 트랙(Spotify 곡) 검색 결과에 딸린 추천글/북마크 통계 (새 백엔드 /api/v1/playlist/songs/tracks/search)
export interface TrackStats {
  trackId: string;
  // 이 트랙에 달린 총 추천글(게시글) 수
  totalSongsCount: number;
  // 이 트랙에 달린 게시글들의 좋아요(=서비스 내 "북마크") 총합
  totalHeartCount: number;
}

export function createTrackStats(raw: {
  trackId: string;
  totalSongsCount: number;
  totalHeartCount: number;
}): TrackStats {
  return {
    trackId: raw.trackId,
    totalSongsCount: raw.totalSongsCount,
    totalHeartCount: raw.totalHeartCount,
  };
}
