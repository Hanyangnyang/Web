// 도메인 엔티티: 곡 등록 전 사용자 기기 상태 (새 백엔드 /api/v1/playlist/songs/creation-status)
export interface SongCreationStatus {
  canCreate: boolean;
  dailyCount: number;
  dailyMaxLimit: number;
  remainingCount: number;
  // 최근 7일 이내 이미 추천한 Spotify 트랙 ID 목록 — 곡 검색 결과에서 중복 선택 방지에 씀
  recentTrackIdsIn7Days: string[];
}

export function createSongCreationStatus(raw: {
  canCreate: boolean;
  dailyCount: number;
  dailyMaxLimit: number;
  remainingCount: number;
  recentTrackIdsIn7Days: string[];
}): SongCreationStatus {
  return {
    canCreate: raw.canCreate,
    dailyCount: raw.dailyCount,
    dailyMaxLimit: raw.dailyMaxLimit,
    remainingCount: raw.remainingCount,
    recentTrackIdsIn7Days: raw.recentTrackIdsIn7Days,
  };
}
