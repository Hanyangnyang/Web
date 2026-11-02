// 컴포넌트: PlaylistView 청크 로딩 중 Suspense fallback — 헤더 → 검색바 → 캐러셀 → 최근 추천된 곡 순으로 홈 화면과 같은 배치
// MiscView가 정적 import하므로 진입 청크에 들어간다. PlaylistView.tsx를 import하면 lazy 분리가 깨지니 주의
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader.js';
import { RecentSongRowSkeleton } from './shared/RecentSongRowSkeleton.js';
import { getPlaylistRootTop } from './playlistLayout.js';

export function PlaylistViewSkeleton({ onBack }: { onBack: () => void }) {
  const top = getPlaylistRootTop();
  return (
    <div
      className="fixed inset-0 z-[1001] overflow-hidden mx-auto w-full max-w-app px-4"
      style={{ backgroundColor: '#FFFFFF', animation: 'fadeIn 0.25s ease-out', top, paddingTop: '1.5rem' }}
    >
      <div aria-hidden className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-app z-[200] bg-white" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들의 추천곡을 들어보고, 나도 추천해봐요!"
        onBack={onBack}
        rightAction={<div className="w-9 h-9 rounded-full skeleton-shimmer" />}
      />
      <div className="-mt-1 mb-2 h-12 rounded-full skeleton-shimmer" />
      <div className="mb-4 aspect-[4/1] rounded-2xl skeleton-shimmer" />
      <div className="mb-2 h-6 w-32 rounded-full skeleton-shimmer" />
      <div className="flex gap-1.5 mb-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 h-8 w-14 rounded-full skeleton-shimmer" />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <RecentSongRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
