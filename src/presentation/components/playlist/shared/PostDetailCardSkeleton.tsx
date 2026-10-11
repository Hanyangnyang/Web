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

  // 실제 PostDetailCard와 같은 그림자·여백·줄 높이로 맞춰서, 로딩이 끝나 카드로 바뀔 때 높이가 튀지 않게 함
  const shadow = 'shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]';

  if (variant === 'grid') {
    return (
      <div className={`h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden ${shadow} ${className}`}>
        <div className="w-full aspect-square skeleton-shimmer" />
        {/* PostDetailCard(2열, narrow)와 같은 구성·여백(px-3 pt-2 pb-2): 이모지 반응 행(24px) / 제목(15px) / 본문(13px, 줄 높이 21px) / 구분선 / 장르(12px) */}
        <div className="px-3 pt-2 pb-2 flex-1 flex flex-col">
          <div className="flex items-start gap-1.5 mb-1">
            <div className="h-[24px] w-9 rounded-full skeleton-shimmer flex-shrink-0" />
          </div>
          <div className="mb-1 h-[22px] flex items-center">
            <div className="h-[15px] w-3/4 rounded-full skeleton-shimmer" />
          </div>
          <div className="mb-2">
            <div className="h-[21px] flex items-center"><div className="h-[13px] w-full rounded-full skeleton-shimmer" /></div>
            <div className="h-[21px] flex items-center"><div className="h-[13px] w-2/3 rounded-full skeleton-shimmer" /></div>
          </div>
          <div className="mt-auto">
            <div className="border-t border-slate-100 mb-3" />
            <div className="h-[18px] flex items-center">
              <div className="h-3 w-16 rounded-full skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${shadow} ${className}`}>
      <div className="w-full aspect-square skeleton-shimmer" />
      {/* PostDetailCard(1열)와 같은 구성·여백(px-4 pt-3 pb-4): 이모지 반응 행(26px) / 제목(17px) / 본문(15px, 줄 높이 24px) / 구분선 / 장르(13px) + 시각 */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="h-[26px] w-14 rounded-full skeleton-shimmer" />
        </div>
        <div className="mb-1 h-[26px] flex items-center">
          <div className="h-[17px] w-1/2 rounded-full skeleton-shimmer" />
        </div>
        <div className="mb-2">
          <div className="h-6 flex items-center"><div className="h-[15px] w-full rounded-full skeleton-shimmer" /></div>
          <div className="h-6 flex items-center"><div className="h-[15px] w-2/3 rounded-full skeleton-shimmer" /></div>
        </div>
        <div className="border-t border-slate-100 mb-3" />
        <div className="flex items-center justify-between gap-2 h-5">
          <div className="h-[13px] w-24 rounded-full skeleton-shimmer" />
          <div className="h-[13px] w-10 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
