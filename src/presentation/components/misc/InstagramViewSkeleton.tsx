// 컴포넌트: InstagramView 청크 로딩 중 Suspense fallback — 실제 화면(헤더 + 아코디언 그룹)과 같은 배치
// MiscView가 정적 import하므로 진입 청크에 들어간다. InstagramView.tsx를 import하면 lazy 분리가 깨지니 주의
import { MiscSubViewHeader } from './MiscSubViewHeader.js';

function AccordionGroupShimmer() {
  return (
    <div className="bg-white border border-slate-200 rounded-card overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-3">
      <div className="flex justify-between items-center px-4 py-2.5">
        <div className="h-4 w-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse" />
      </div>
      <div className="border-t border-slate-100">
        {[0, 1].map((i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-dashed border-slate-200' : ''}`}>
            <div className="w-[54px] h-[54px] rounded-full bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 rounded bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse w-2/5" />
              <div className="h-3 rounded bg-gradient-to-br from-slate-100 to-slate-200/70 animate-pulse w-[70%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InstagramViewSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="pb-20">
      <MiscSubViewHeader title="학교 인스타그램" onBack={onBack} />
      <AccordionGroupShimmer />
      <AccordionGroupShimmer />
    </div>
  );
}
