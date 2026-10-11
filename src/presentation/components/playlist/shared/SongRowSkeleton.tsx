import { type ReactNode } from 'react';

interface SongRowSkeletonProps {
  // 카드 바깥 래퍼 클래스 — 화면마다 테두리/그림자/구분선 스타일이 달라서 그대로 받음
  className?: string;
  // 썸네일 왼쪽에 붙는 추가 요소(예: ChartView의 순위 번호 자리)
  leading?: ReactNode;
  // 오른쪽 끝에 붙는 추가 요소(예: ChartView의 듣기/공유 아이콘 자리)
  trailing?: ReactNode;
  // 썸네일 크기 — 기본은 48px(w-12 h-12). 로딩이 끝난 뒤 실제 카드의 썸네일 크기와 맞춰야 할 때만 덮어쓴다
  thumbnailClassName?: string;
}

// 곡 한 줄(썸네일 + 제목/부제 2줄) 스켈레톤 — PlaylistHomeView(최근 추가된 곡)/SearchResultsView(게시글)/
// ChartView(차트 리스트)가 거의 동일한 마크업을 각자 반복하고 있어 공용으로 뽑음
export function SongRowSkeleton({ className = '', leading, trailing, thumbnailClassName = 'w-12 h-12' }: SongRowSkeletonProps) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 ${className}`}>
      {leading}
      <div className={`${thumbnailClassName} rounded skeleton-shimmer flex-shrink-0`} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3.5 w-2/3 rounded-full skeleton-shimmer" />
        <div className="h-3 w-1/3 rounded-full skeleton-shimmer" />
      </div>
      {trailing}
    </div>
  );
}
