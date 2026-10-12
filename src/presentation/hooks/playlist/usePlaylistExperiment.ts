// 훅(ViewModel): "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정 조회 (docs/playlist-recent-songs-ab-test.md 참고)
// ⚠️ 디자인 비교용 프리뷰 브랜치(preview/ab-recent-songs-b-test) — PostHog 플래그를 읽지 않고 항상 B안(test)으로 고정.
// 플래그 조회를 아예 안 해서 exposure 이벤트가 안 나가므로, 프리뷰에서 눌러봐도 실제 실험 결과에 섞이지 않음. merge 금지
export const RECENT_SONGS_TAP_AREA_FLAG = 'playlist-recent-songs-tap-area';

export type RecentSongsTapAreaVariant = 'control' | 'test';

// 재생 버튼이 눌린 표면 — 홈 미리보기 행인지, 최근 추가된 곡 전체보기 카드인지 구분해서 지표를 분리 집계하기 위함
export type RecentSongsPlaySurface = 'home_preview' | 'recent_full_list';

export function useRecentSongsTapAreaVariant(): RecentSongsTapAreaVariant {
  return 'test';
}
