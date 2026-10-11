// TrackPostCollectionView의 추천글 카드 로딩 스켈레톤 — 실제 카드와 같은 여백·그림자·줄 높이:
// 한마디(15px, leading-snug ≈ 20px) 두 줄 / 이모지 반응 칩(compact 26px) + 시각(13px)
export function PostRowSkeleton() {
  return (
    <div
      className="flex flex-col gap-1.5 px-3.5 py-3 bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]"
      aria-hidden="true"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="h-5 flex items-center"><div className="h-[15px] w-full rounded-full skeleton-shimmer" /></div>
          <div className="h-5 flex items-center"><div className="h-[15px] w-2/3 rounded-full skeleton-shimmer" /></div>
        </div>
        <div className="h-6 w-6 rounded-full skeleton-shimmer flex-shrink-0 ml-auto" />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-[26px] w-9 rounded-full skeleton-shimmer" />
        <div className="ml-auto h-[13px] w-10 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}
