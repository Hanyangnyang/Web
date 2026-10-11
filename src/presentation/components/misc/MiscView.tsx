// 컴포넌트: 기타탭 화면 오케스트레이터 (그리드 ↔ 하위 View 라우팅)
import { useState, useEffect, useRef, lazy, Suspense, type ComponentType } from 'react';
import { usePostHog } from 'posthog-js/react';
import { GymView } from './GymView.jsx';
import { ClubView } from './ClubView.jsx';
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

// deepLinkBox가 어디서 왔는지 — 서브뷰 진입 경로 계측(playlist_opened의 source)에 씀.
// deeplink: 카카오 공유 등 링크(콜드 스타트 URL 포함), push: 네이티브 푸시 탭, banner: 소식탭 배너, portal_artist: 소식탭 아티스트 추천
export type MiscBoxOpenSource = 'deeplink' | 'push' | 'banner' | 'portal_artist';

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
  deepLinkBox?: string | null;  // 소식탭 배너에서 넘어올때
  deepLinkBoxSource?: MiscBoxOpenSource;  // deepLinkBox의 출처 — 진입 경로 계측용
  onDeepLinkBoxHandled?: () => void;
  deepLinkTrackId?: string | null;   // 플레이리스트 카카오 공유를 위함
  onDeepLinkTrackIdHandled?: () => void;
  deepLinkPostId?: string | null;   // 추천글 카드에서 공유한 링크의 게시글 id (deepLinkTrackId와 함께 옴)
  deepLinkSearchQuery?: string | null;   // 소식탭 플레이리스트 배너에서 아티스트를 눌렀을 때, 그 검색 결과 화면으로 바로 가기 위함
  onDeepLinkSearchQueryHandled?: () => void;
  deepLinkClubId?: string | null;   // 소식탭 배너에서 넘어올때, 해당하는 동아리 위치로 스크롤하기 위함
  onDeepLinkClubIdHandled?: () => void;
}

export function MiscView({ resetSignal, isActive = false, deepLinkBox, deepLinkBoxSource = 'deeplink', onDeepLinkBoxHandled, deepLinkTrackId, onDeepLinkTrackIdHandled, deepLinkPostId, deepLinkSearchQuery, onDeepLinkSearchQueryHandled, deepLinkClubId, onDeepLinkClubIdHandled }: MiscViewProps) {
  const posthog = usePostHog();
  const [subView, setSubView] = useState<SubView>('list');
  const [InstagramViewComp, setInstagramViewComp] = useState<SubViewComponent | null>(null);
  const [FeedbackViewComp, setFeedbackViewComp] = useState<SubViewComponent | null>(null);

  useEffect(() => {
    setSubView('list');
  }, [resetSignal]);

  // 다음 서브뷰 전환이 어떤 경로로 일어났는지 — 전환을 일으키는 쪽(박스 클릭/딥링크)이 setSubView 직전에 채워둠
  const openPropsRef = useRef<{ source: MiscBoxOpenSource | 'misc_box'; shared_track: boolean }>({ source: 'misc_box', shared_track: false });

  // 배너 등 딥링크로 넘어온 서브뷰를 한 번 적용하고 부모에 소비 완료를 알린다 (CampusMapView의 deepLinkChip과 동일한 방식)
  useEffect(() => {
    if (!deepLinkBox) return;
    // shared_track: 카카오 공유처럼 특정 곡을 가리키는 링크로 들어왔는지(trackId는 box와 같은 렌더에 함께 세팅됨)
    openPropsRef.current = { source: deepLinkBoxSource, shared_track: !!deepLinkTrackId };
    setSubView(deepLinkBox as SubView);
    onDeepLinkBoxHandled?.();
  }, [deepLinkBox]); // eslint-disable-line react-hooks/exhaustive-deps

  // 플레이리스트 진입 계측 — 리텐션/도달률의 기준 이벤트. 이미 플레이리스트에 있는 채로 딥링크가 또 와도
  // subView가 안 바뀌니 다시 안 찍힘(새 진입이 아님). 다른 탭에 갔다 와도 MiscView는 마운트가 유지돼서 안 찍힘
  useEffect(() => {
    if (subView !== 'playlist') return;
    posthog?.capture('playlist_opened', openPropsRef.current);
  }, [subView]); // eslint-disable-line react-hooks/exhaustive-deps

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
      openPropsRef.current = { source: 'misc_box', shared_track: false };
      setSubView(box);
    }
  };

  if (subView === 'gym') return <GymView onBack={() => setSubView('list')} />;
  if (subView === 'playlist') {
    return (
      <PlaylistView
        onBack={() => setSubView('list')}
        isActive={isActive}
        deepLinkTrackId={deepLinkTrackId}
        onDeepLinkTrackIdHandled={onDeepLinkTrackIdHandled}
        deepLinkPostId={deepLinkPostId}
        deepLinkSearchQuery={deepLinkSearchQuery}
        onDeepLinkSearchQueryHandled={onDeepLinkSearchQueryHandled}
      />
    );
  }
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
  if (subView === 'clubs') {
    const onBack = () => setSubView('list');
    return <ClubView onBack={onBack} scrollToClubId={deepLinkClubId} onScrollToClubIdHandled={onDeepLinkClubIdHandled} />;
  }

  return <MiscMenuGrid onBoxClick={handleBoxClick} />;
}
