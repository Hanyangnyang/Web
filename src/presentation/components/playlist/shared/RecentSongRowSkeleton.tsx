// RecentSongRow(홈 "최근 추가된 곡" 미리보기 행)의 로딩 스켈레톤 — 실제 행과 같은 뼈대:
// 앨범커버는 행 너비의 20% 정사각형(이 폭이 행 높이를 정함), 오른쪽은 세 줄(제목·가수 / 한마디 / 반응칩·시각) + 화살표 자리.
// 로딩이 끝나 실제 행으로 바뀔 때 높이가 튀지 않도록 RecentSongRow의 클래스를 그대로 맞춰둠
import { ChevronRight } from 'lucide-react';

export function RecentSongRowSkeleton() {
  return (
    <div
      className="relative flex items-stretch bg-white rounded-card border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] overflow-hidden"
      aria-hidden="true"
    >
      <div className="w-1/5 flex-shrink-0 aspect-square skeleton-shimmer" />
      <div className="flex flex-1 min-w-0 gap-1 pl-2.5 pr-2">
        <div className="flex-1 min-w-0 flex flex-col justify-evenly">
          <div className="h-3.5 w-3/5 rounded-full skeleton-shimmer" />
          <div className="h-3 w-4/5 rounded-full skeleton-shimmer" />
          <div className="flex items-center gap-1">
            <div className="h-[18px] w-10 rounded-full skeleton-shimmer" />
            <div className="h-[18px] w-10 rounded-full skeleton-shimmer" />
            <div className="ml-auto h-2.5 w-10 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <ChevronRight size={24} className="text-slate-200 flex-shrink-0 self-center" />
      </div>
    </div>
  );
}
