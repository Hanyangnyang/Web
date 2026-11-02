// 유틸: 중앙동아리 화면 상단 여백(노치/상태바 포함) — ClubView·ClubViewSkeleton 공용
// 두 화면이 같은 값을 써야 스켈레톤 → 실제 화면 전환 때 헤더 위치가 튀지 않는다
import { isNativeApp, getPlatform } from '../../../lib/platform.js';

export function getClubScrollTopPadding() {
  return `calc(1.5rem + ${isNativeApp() && getPlatform() === 'android' ? 'env(safe-area-inset-top, 28px)' : 'env(safe-area-inset-top)'})`;
}
