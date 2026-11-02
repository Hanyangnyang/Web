// 컴포넌트: 기타탭 화면 오케스트레이터 (그리드 ↔ 하위 View 라우팅)
import { useState, useEffect, useRef, lazy, Suspense, type ComponentType } from 'react';
import { usePostHog } from 'posthog-js/react';
import { GymView } from './GymView.jsx';
import { MiscMenuGrid, type MiscBoxKey } from './MiscMenuGrid.jsx';
import { PlaylistViewSkeleton } from '../playlist/PlaylistViewSkeleton.jsx';
import { ClubViewSkeleton } from './ClubViewSkeleton.jsx';
import { InstagramViewSkeleton } from './InstagramViewSkeleton.jsx';
import { FeedbackViewSkeleton } from './FeedbackViewSkeleton.jsx';
import { prefetchGymSchedule } from '../../hooks/useGymSchedule.js';
import { preconnectSpotifyImages } from '../../../lib/preconnect.js';

// lazy 컴포넌트와 프리페치용 load를 한 쌍으로 만든다. 둘이 같은 Promise를 공유하도록 load 결과를 캐싱
// factory는 호출부에서 import('리터럴 경로')로 직접 써야 Vite가 빌드 때 청크를 나눌 수 있다 (경로를 변수로 넘기면 안 됨)
function lazyWithPreload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  let promise: Promise<{ default: T }> | null = null;
  let loaded: { default: T } | null = null;
  const load = () => (promise ??= factory().then(m => (loaded = m)));
  // Promise는 이미 fulfilled여도 then 콜백이 마이크로태스크로 밀려서, lazy가 첫 렌더에 한 번은 suspend해 fallback이 스치듯 보인다.
  // 프리페치가 이미 끝났으면 then을 즉시 호출하는 thenable을 넘겨 lazy가 동기적으로 풀리게 한다 → fallback 없이 바로 렌더
  const Lazy = lazy(() => {
    if (!loaded) return load();
    const m = loaded;
    return { then: (resolve: (value: { default: T }) => void) => resolve(m) } as unknown as Promise<{ default: T }>;
  });
  return { load, Lazy };
}

// 플레이리스트 Lazy load
const { load: loadPlaylistView, Lazy: LazyPlaylistView } = lazyWithPreload(
  () => import('../playlist/PlaylistView').then(m => ({ default: m.PlaylistView })),
);

// 중앙동아리 Lazy load — 동아리 데이터(Club.ts)는 소식탭 동아리 추천 카드도 쓰므로 엔트리에 남는다
const { load: loadClubView, Lazy: LazyClubView } = lazyWithPreload(
  () => import('./ClubView.jsx').then(m => ({ default: m.ClubView })),
);

// 인스타그램 Lazy load
const { load: loadInstagramView, Lazy: LazyInstagramView } = lazyWithPreload(
  () => import('./InstagramView.jsx').then(m => ({ default: m.InstagramView })),
);

// 피드백 Lazy load
const { load: loadFeedbackView, Lazy: LazyFeedbackView } = lazyWithPreload(
  () => import('./FeedbackView.jsx').then(m => ({ default: m.FeedbackView })),
);

type SubView = 'list' | MiscBoxKey;

// deepLinkBox가 어디서 왔는지 — 서브뷰 진입 경로 계측(playlist_opened의 source)에 씀.
// deeplink: 카카오 공유 등 링크(콜드 스타트 URL 포함), push: 네이티브 푸시 탭, banner: 소식탭 배너, portal_artist: 소식탭 아티스트 추천
export type MiscBoxOpenSource = 'deeplink' | 'push' | 'banner' | 'portal_artist';

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
  const [prevResetSignal, setPrevResetSignal] = useState(resetSignal);
  if (resetSignal !== prevResetSignal) {
    setPrevResetSignal(resetSignal);
    setSubView('list');
  }

  // 기타탭 진입(isActive) 시 하위 View 청크와 헬스장 시간표를 미리 받아둔다
  // 플레이리스트에 들어가면 앨범커버가 바로 필요하므로 이미지 서버 연결도 같이 열어둔다
  useEffect(() => {
    if (!isActive) return;
    preconnectSpotifyImages();
    prefetchGymSchedule();
    loadPlaylistView();
    loadClubView();
    loadInstagramView();
    loadFeedbackView();
  }, [isActive]);

  // 다음 서브뷰 전환이 어떤 경로로 일어났는지 — 전환을 일으키는 쪽(박스 클릭/딥링크)이 setSubView 직전에 채워둠
  const openPropsRef = useRef<{ source: MiscBoxOpenSource | 'misc_box'; shared_track: boolean }>({ source: 'misc_box', shared_track: false });

  // 배너 등 딥링크로 넘어온 서브뷰를 한 번 적용하고 부모에 소비 완료를 알린다 (CampusMapView의 deepLinkChip과 동일한 방식)
  useEffect(() => {
    if (!deepLinkBox) return;
    // shared_track: 카카오 공유처럼 특정 곡을 가리키는 링크로 들어왔는지(trackId는 box와 같은 렌더에 함께 세팅됨)
    openPropsRef.current = { source: deepLinkBoxSource, shared_track: !!deepLinkTrackId };
    // 부모가 한 번 내려준 딥링크 값을 적용하고 소비 완료를 알리는 패턴 — 콜백·ref 설정이 렌더 중엔 불가하고 딥링크 진입 시 한 번뿐이라 effect에 둠
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubView(deepLinkBox as SubView);
    onDeepLinkBoxHandled?.();
  }, [deepLinkBox]); // eslint-disable-line react-hooks/exhaustive-deps

  // 플레이리스트 진입 계측 — 리텐션/도달률의 기준 이벤트. 이미 플레이리스트에 있는 채로 딥링크가 또 와도
  // subView가 안 바뀌니 다시 안 찍힘(새 진입이 아님). 다른 탭에 갔다 와도 MiscView는 마운트가 유지돼서 안 찍힘
  useEffect(() => {
    if (subView !== 'playlist') return;
    // $set_once: 사용자 속성 — 처음 들어온 날짜를 한 번만 기록해서 "언제부터 쓰기 시작했나" 코호트를 나눌 수 있게 함
    posthog?.capture('playlist_opened', {
      ...openPropsRef.current,
      $set_once: { playlist_first_opened_at: new Date().toISOString() },
    });
  }, [subView]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const props = {
      onBack: () => setSubView('list'),
      isActive,
      deepLinkTrackId,
      onDeepLinkTrackIdHandled,
      deepLinkPostId,
      deepLinkSearchQuery,
      onDeepLinkSearchQueryHandled,
    };
    return (
      <Suspense fallback={<PlaylistViewSkeleton onBack={props.onBack} />}>
        <LazyPlaylistView {...props} />
      </Suspense>
    );
  }
  if (subView === 'insta') {
    const onBack = () => setSubView('list');
    return (
      <Suspense fallback={<InstagramViewSkeleton onBack={onBack} />}>
        <LazyInstagramView onBack={onBack} />
      </Suspense>
    );
  }
  if (subView === 'feedback') {
    const onBack = () => setSubView('list');
    return (
      <Suspense fallback={<FeedbackViewSkeleton onBack={onBack} />}>
        <LazyFeedbackView onBack={onBack} />
      </Suspense>
    );
  }
  if (subView === 'clubs') {
    const props = { onBack: () => setSubView('list'), scrollToClubId: deepLinkClubId, onScrollToClubIdHandled: onDeepLinkClubIdHandled };
    return (
      <Suspense fallback={<ClubViewSkeleton onBack={props.onBack} />}>
        <LazyClubView {...props} />
      </Suspense>
    );
  }

  return <MiscMenuGrid onBoxClick={handleBoxClick} />;
}
