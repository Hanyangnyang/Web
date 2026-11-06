// 유틸: 플레이리스트 루트가 상태바/노치 높이만큼 내려오는 top 값 — PlaylistView·PlaylistViewSkeleton 공용
// 두 화면이 같은 값을 써야 스켈레톤 → 실제 화면 전환 때 위치가 튀지 않는다
import { isNativeApp, getPlatform } from '../../../lib/platform.js';

export function getPlaylistRootTop() {
  return isNativeApp() && getPlatform() === 'android' ? 'env(safe-area-inset-top, 28px)' : 'env(safe-area-inset-top)';
}
