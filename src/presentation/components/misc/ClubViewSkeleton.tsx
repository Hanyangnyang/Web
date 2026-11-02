// 컴포넌트: ClubView 청크 로딩 중 Suspense fallback — 헤더 → 검색바 → 카테고리 칩 → 개수 → 오늘의 추천 카드 → 목록 순으로 ClubView와 같은 배치
// MiscView가 정적 import하므로 진입 청크에 들어간다. ClubView.tsx를 import하면 lazy 분리가 깨지니 주의
import { MiscSubViewHeader } from './MiscSubViewHeader.js';
import { getClubScrollTopPadding } from './clubLayout.js';

export function ClubViewSkeleton({ onBack }: { onBack: () => void }) {
  const scrollTopPadding = getClubScrollTopPadding();
  return (
    <div className="fixed inset-0 z-[1001] bg-surface">
      <div className="mx-auto h-full w-full max-w-app overflow-hidden px-4" style={{ paddingTop: scrollTopPadding }}>
        <div className="-mb-4 pb-2">
          <MiscSubViewHeader title="중앙동아리" onBack={onBack} rightAction={<div className="h-[34px] w-[84px] rounded-full skeleton-shimmer" />} />
        </div>
        <div className="mb-2 h-[42px] rounded-card skeleton-shimmer" />
        <div className="flex gap-1.5 pb-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 h-[31px] w-14 rounded-xl skeleton-shimmer" />
          ))}
        </div>
        <div className="mx-1 h-3 w-16 rounded-full skeleton-shimmer" />
        <div className="pt-4">
          <div className="mb-2 h-[80px] rounded-2xl skeleton-shimmer" />
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-3 flex items-center gap-3">
                <div className="w-[52px] h-[52px] rounded-card skeleton-shimmer flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3.5 w-2/5 rounded-full skeleton-shimmer" />
                  <div className="h-3 w-4/5 rounded-full skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
