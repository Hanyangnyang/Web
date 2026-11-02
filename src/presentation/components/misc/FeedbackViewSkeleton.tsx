// 컴포넌트: FeedbackView 청크 로딩 중 Suspense fallback — 실제 화면(헤더 + 입력 카드)과 같은 배치
// MiscView가 정적 import하므로 진입 청크에 들어간다. FeedbackView.tsx를 import하면 lazy 분리가 깨지니 주의
import { MiscSubViewHeader } from './MiscSubViewHeader.js';

export function FeedbackViewSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="pb-20">
      <MiscSubViewHeader title="피드백 보내기" onBack={onBack} />
      <div className="bg-white border border-slate-200 rounded-card p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
          <div className="h-4 w-40 rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
        </div>

        <div className="flex flex-col gap-1.5 mb-3">
          <div className="h-2.5 w-full rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
          <div className="h-2.5 w-4/5 rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
        </div>

        <div className="w-full min-h-[140px] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse mb-3" />

        <div className="flex justify-between items-center">
          <div className="h-2.5 w-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
          <div className="h-8 w-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
