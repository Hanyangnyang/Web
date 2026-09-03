interface PostDetailCardSkeletonProps {
  // 'card': PostDetailCard(1열/게시글 상세)와 동일한 스켈레톤. 'grid': SongListScreen 2열 그리드 전용 축약형
  variant?: 'card' | 'grid';
  className?: string;
}

// PostDetailCard 로딩 중 자리표시자 — 게시글 상세 화면과 최근추가된곡 등 리스트 화면(1열)이 공유
export function PostDetailCardSkeleton({ variant = 'card', className = '' }: PostDetailCardSkeletonProps) {
  if (variant === 'grid') {
    return (
      <div className={`h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
        <div className="w-full aspect-square skeleton-shimmer" />
        <div className="px-4 pt-3 pb-4 flex-1 flex flex-col gap-2">
          <div className="h-4 w-3/4 rounded-full skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded-full skeleton-shimmer" />
          <div className="h-3 w-full rounded-full skeleton-shimmer" />
          <div className="h-3 w-16 rounded-full skeleton-shimmer mt-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="w-full aspect-square skeleton-shimmer" />
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-full skeleton-shimmer flex-shrink-0" />
          <div className="h-5 w-14 rounded-full skeleton-shimmer" />
        </div>
        <div className="h-4 w-1/2 rounded-full skeleton-shimmer mb-2" />
        <div className="h-3.5 w-full rounded-full skeleton-shimmer mb-1.5" />
        <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer mb-3" />
        <div className="h-3 w-24 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}
