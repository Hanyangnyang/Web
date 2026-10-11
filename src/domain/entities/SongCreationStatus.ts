// 도메인 엔티티: 곡 등록 전 사용자 기기 상태 (새 백엔드 /api/v1/playlist/songs/creation-status)
export interface SongCreationStatus {
  canCreate: boolean;
  dailyCount: number;
  dailyMaxLimit: number;
  remainingCount: number;
  // 최근 7일 이내 이미 추천한 Spotify 트랙 ID 목록 — 곡 검색 결과에서 중복 선택 방지에 씀
  recentTrackIdsIn7Days: string[];
  // 하루 한도와 별개로 서버가 일시적으로 등록을 막은 상태 — true면 canCreate도 false로 오며, 안내 문구를
  // "한도 소진(내일 다시)"이 아니라 blockedUntil 기준으로 보여줘야 함
  temporarilyBlocked: boolean;
  // 임시 차단이 풀리는 시각(ISO 8601) — 차단이 아니면 null
  blockedUntil: string | null;
}

export function createSongCreationStatus(raw: SongCreationStatus): SongCreationStatus {
  return { ...raw };
}
