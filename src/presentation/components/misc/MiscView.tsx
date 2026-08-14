// 컴포넌트: 기타탭 화면 오케스트레이터 (그리드 ↔ 하위 View 라우팅)
import { useState, useEffect, lazy, Suspense, type ComponentType } from 'react';
import { usePostHog } from 'posthog-js/react';
import { GymView } from './GymView.jsx';
import { MiscMenuGrid, type MiscBoxKey } from './MiscMenuGrid.jsx';
import { MiscSubViewHeader } from './MiscSubViewHeader.jsx';
import { PlaylistView } from '../playlist/PlaylistView';

type SubViewComponent = ComponentType<{ onBack: () => void }>;

let instagramViewPromise: Promise<{ default: SubViewComponent }> | null = null;
const loadInstagramView = () => {
  if (!instagramViewPromise) {
    instagramViewPromise = import('./InstagramView.jsx').then(m => ({ default: m.InstagramView }));
  }
  return instagramViewPromise;
};

let feedbackViewPromise: Promise<{ default: SubViewComponent }> | null = null;
const loadFeedbackView = () => {
  if (!feedbackViewPromise) {
    feedbackViewPromise = import('./FeedbackView.jsx').then(m => ({ default: m.FeedbackView }));
  }
  return feedbackViewPromise;
};

const LazyInstagramView = lazy(loadInstagramView);
const LazyFeedbackView = lazy(loadFeedbackView);

type SubView = 'list' | MiscBoxKey;

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

function InstagramViewFallback({ onBack }: { onBack: () => void }) {
  return (
    <div className="pb-20">
      <MiscSubViewHeader title="학교 인스타그램" onBack={onBack} />
      <AccordionGroupShimmer />
      <AccordionGroupShimmer />
    </div>
  );
}

function FeedbackViewFallback({ onBack }: { onBack: () => void }) {
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

interface MiscViewProps {
  resetSignal: number;
  isActive?: boolean;
}

export function MiscView({ resetSignal, isActive = false }: MiscViewProps) {
  const posthog = usePostHog();
  const [subView, setSubView] = useState<SubView>('list');
  const [InstagramViewComp, setInstagramViewComp] = useState<SubViewComponent | null>(null);
  const [FeedbackViewComp, setFeedbackViewComp] = useState<SubViewComponent | null>(null);

  useEffect(() => {
    setSubView('list');
  }, [resetSignal]);

  useEffect(() => {
    if (!isActive) return;
    loadInstagramView().then(m => setInstagramViewComp(() => m.default));
    loadFeedbackView().then(m => setFeedbackViewComp(() => m.default));
  }, [isActive]);

  const handleBoxClick = (box: MiscBoxKey) => {
    posthog?.capture('misc_box_clicked', { box });
    if (box === 'calendar') {
      window.open('https://www.hanyang.ac.kr/-93', '_blank', 'noopener,noreferrer');
    } else {
      setSubView(box);
    }
  };

  if (subView === 'gym') return <GymView onBack={() => setSubView('list')} />;
  if (subView === 'playlist') return <PlaylistView onBack={() => setSubView('list')} />;
  if (subView === 'insta') {
    const onBack = () => setSubView('list');
    if (InstagramViewComp) {
      const Comp = InstagramViewComp;
      return <Comp onBack={onBack} />;
    }
    return (
      <Suspense fallback={<InstagramViewFallback onBack={onBack} />}>
        <LazyInstagramView onBack={onBack} />
      </Suspense>
    );
  }
  if (subView === 'feedback') {
    const onBack = () => setSubView('list');
    if (FeedbackViewComp) {
      const Comp = FeedbackViewComp;
      return <Comp onBack={onBack} />;
    }
    return (
      <Suspense fallback={<FeedbackViewFallback onBack={onBack} />}>
        <LazyFeedbackView onBack={onBack} />
      </Suspense>
    );
  }

  return <MiscMenuGrid onBoxClick={handleBoxClick} />;
}
