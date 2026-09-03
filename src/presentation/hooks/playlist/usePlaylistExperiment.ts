// 훅(ViewModel): "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정 조회 (docs/playlist-recent-songs-ab-test.md 참고)
// PostHog 대시보드에 이 키로 Feature Flag(Experiment)를 만들고, 배포 대상 %와 'test' variant 비율을 거기서 조절한다.
// 플래그가 아직 없거나(대시보드에 안 만듦) 값을 로딩 중이면 항상 'control'(현재 로컬 UI)로 안전하게 처리 —
// 즉 이 플래그를 만들기 전까지는 배포해도 전원 control로만 보임
import { useFeatureFlagVariantKey } from 'posthog-js/react';

export const RECENT_SONGS_TAP_AREA_FLAG = 'playlist-recent-songs-tap-area';

export type RecentSongsTapAreaVariant = 'control' | 'test';

// 재생 버튼이 눌린 표면 — 홈 미리보기 행인지, 최근 추가된 곡 전체보기 카드인지 구분해서 지표를 분리 집계하기 위함
export type RecentSongsPlaySurface = 'home_preview' | 'recent_full_list';

export function useRecentSongsTapAreaVariant(): RecentSongsTapAreaVariant {
  const variantKey = useFeatureFlagVariantKey(RECENT_SONGS_TAP_AREA_FLAG);
  return variantKey === 'test' ? 'test' : 'control';
}
