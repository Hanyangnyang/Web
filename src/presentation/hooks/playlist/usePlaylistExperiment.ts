// 훅(ViewModel): "최근 추가된 곡" 재생 인터랙션 — 이 브랜치(feat/erica-playlist-b)는 A/B 분기 없이
// B안(test)만 고정 노출. 실제 50:50 A/B 테스트 코드는 feat/erica-playlist 브랜치 참고
// (docs/playlist-recent-songs-ab-test.md)
export const RECENT_SONGS_TAP_AREA_FLAG = 'playlist-recent-songs-tap-area';

export type RecentSongsTapAreaVariant = 'control' | 'test';

// 재생 버튼이 눌린 표면 — 홈 미리보기 행인지, 최근 추가된 곡 전체보기 카드인지 구분해서 지표를 분리 집계하기 위함
export type RecentSongsPlaySurface = 'home_preview' | 'recent_full_list';

export function useRecentSongsTapAreaVariant(): RecentSongsTapAreaVariant {
  return 'test';
}
