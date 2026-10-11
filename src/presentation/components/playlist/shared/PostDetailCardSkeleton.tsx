interface PostDetailCardSkeletonProps {
  // 'card': PostDetailCard(1열/게시글 상세)와 동일한 스켈레톤. 'grid': SongListScreen 2열 그리드 전용 축약형.
  // 'summary': 저장한 곡처럼 앨범아트 + 제목/가수명 + > 버튼만 있는 요약 카드(gridOnly) 전용
  variant?: 'card' | 'grid' | 'summary';
  className?: string;
}

// PostDetailCard 로딩 중 자리표시자 — 게시글 상세 화면과 최근추가된곡 등 리스트 화면(1열)이 공유
export function PostDetailCardSkeleton({ variant = 'card', className = '' }: PostDetailCardSkeletonProps) {
  if (variant === 'summary') {
    return (
      <div className={`h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
        <div className="w-full aspect-square skeleton-shimmer" />
        {/* 실제 카드(narrow)와 같은 여백 — 왼쪽은 제목(15px)/가수명(13px)을 세로로 쌓고, 오른쪽 끝은 > 버튼 자리 */}
        <div className="px-3 pt-2 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="h-[15px] w-3/4 rounded-full skeleton-shimmer mb-1.5" />
              <div className="h-[13px] w-1/2 rounded-full skeleton-shimmer" />
            </div>
            <div className="w-5 h-5 rounded-full skeleton-shimmer flex-shrink-0" />
          </div>
          {/* 제목 아래 수평선 + "n명이 좋아하는 노래에요." 한 줄 */}
          <div className="mt-1.5 pt-1.5 border-t border-slate-200">
            <div className="h-[11px] w-2/3 rounded-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
        <div className="w-full aspect-square skeleton-shimmer" />
        <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
          {/* PostDetailCard(2열)와 같은 구성: 이모지 반응 행 / 제목 / 본문 / 장르 */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-6 h-6 rounded-full skeleton-shimmer flex-shrink-0" />
            <div className="h-5 w-12 rounded-full skeleton-shimmer" />
          </div>
          <div className="h-4 w-3/4 rounded-full skeleton-shimmer mb-2" />
          <div className="h-3.5 w-full rounded-full skeleton-shimmer mb-1.5" />
          <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer mb-3" />
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
