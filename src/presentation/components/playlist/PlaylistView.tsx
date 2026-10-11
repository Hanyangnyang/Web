import { useState, useEffect, useLayoutEffect, useCallback, useRef, type CSSProperties } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/playlist/usePullToRefresh';
import { useBackHandler } from '../../hooks/useBackHandler';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { FloatingSpotifyPlayer } from './shared/FloatingSpotifyPlayer';
import { AddSongFab, FAB_HEIGHT_PX, FAB_CLOSED_BOTTOM_PX, PLAYER_GAP_PX } from './shared/AddSongFab';
import { SearchSongFab, SEARCH_FAB_STACK_PX } from './shared/SearchSongFab';
import { RecommendSongView } from './recommendSong/RecommendSongView';
import { EMPTY_GENRE_FILTER, type GenreFilterState } from './shared/GenreFilterChips';
import { RecentSongsView } from './recentSongs/RecentSongsView';
import { SearchResultsView } from './searchResults/SearchResultsView';
import { SearchPostsView } from './searchResults/SearchPostsView';
import { TrackPostCollectionView } from './trackPostCollection/TrackPostCollectionView';
import { PostView } from './post/PostView';
import { MyPageView } from './myPage/MyPageView';
import { LikedSongsView } from './likedSongs/LikedSongsView';
import { MySongsView } from './mySongs/MySongsView';
import { PlaylistHomeView } from './home/PlaylistHomeView';
import { type Song, type ChartPeriod, type TrackSummary } from './playlistTypes';
import { ChartView } from './chart/ChartView';
import { type ChartTrack } from '../../../domain/entities/PopularityChart.js';
import { getOrCreateAnonymousUserId, AuthRateLimitError } from '../../../lib/supabase.js';
import { useRecentSongsInfinite } from '../../hooks/playlist/useRecentSongsInfinite.js';
import { useMySongs } from '../../hooks/playlist/useMySongs.js';
import { RECENT_SONGS_INFINITE_QUERY_KEY, LIKED_SONGS_QUERY_KEY, MY_SONGS_QUERY_KEY, MY_SONGS_INFINITE_QUERY_KEY, type SongPagesData } from '../../hooks/playlist/playlistQueryKeys.js';
import { ConfirmPopup } from './shared/ConfirmPopup';
import { usePlaylistPlayer } from '../../hooks/playlist/usePlaylistPlayer';
import { usePopularityChart } from '../../hooks/playlist/usePopularityChart.js';
import { useRecentSongsTapAreaVariant } from '../../hooks/playlist/usePlaylistExperiment';
import { useScreenDwellTracking } from '../../hooks/playlist/useScreenDwellTracking.js';

const RECENT_SONGS_LIMIT = 5;
const CHART_PREVIEW_LIMIT = 10;
const EMPTY_SONGS: Song[] = []; // 데이터 도착 전 fallback — 매 렌더마다 새 [] 를 만들면 songs를 deps로 쓰는 콜백이 계속 재생성되므로 모듈 상수로 고정
const EMPTY_CHART: ChartTrack[] = []; // 인기차트 화면 데이터 도착 전 fallback (위 EMPTY_SONGS와 같은 이유)

// 화면 스택의 한 칸 = 화면 이름 + 그 화면이 쓰는 파라미터 
type ScreenFrame =
  | { name: 'main' }
  | { name: 'recent'; scrollTarget: string | null; highlight?: boolean } // highlight: false면 스크롤만 하고 카드 강조 생략(홈 "더보기"). // scrollTarget: 홈의 최근추가된곡 섹션의 곡 카드를 눌렀을때, 해당하는 곡으로 스크롤하기 위함 
  // prefillTrack: 게시글 모음에서 FAB을 누르는 등 특정 곡이 미리 채워진 채로 진입할 때의 곡
  // prefillQuery: 검색 결과 화면의 FAB에서 들어올 때 그 검색어로 곡 검색을 미리 해둠
  | { name: 'addSong'; prefillTrack: TrackSummary | null; prefillQuery: string | null }
  | { name: 'search' }
  // query: 검색 결과 화면의 추천글 "더보기"로 들어온 검색어 — 그 검색어의 추천글 전체 목록(SearchPostsView)
  | { name: 'searchPosts'; query: string }
  // track: 검색 결과·인기차트 등에서 눌러 선택된 곡 — TrackPostCollectionView(곡 단위 게시글 모음)에 넘김
  | { name: 'trackPosts'; track: TrackSummary }
  // postId: 게시글 목록에서 눌러 선택된 게시글 id — PostView가 GET /api/v1/playlist/songs/{id}로 상세 조회
  | { name: 'postDetail'; postId: string }
  | { name: 'chart'; scrollTarget: string | null } // scrollTarget: 홈의 인기차트 카드를 눌렀을 때 해당 곡으로 스크롤
  | { name: 'myActivity' }
  | { name: 'liked' }
  | { name: 'mySongs'; scrollTarget: string | null }; // scrollTarget: 홈의 내가추천한곡 카드를 눌렀을 때 해당 곡으로 스크롤
type PlaylistScreen = ScreenFrame['name'];
type ViewMode = 'grid' | 'list';
type ListScreen = 'recent' | 'mySongs'; // 그리드/리스트 토글이 있는 목록 화면들 (저장한 곡은 2열 고정이라 제외)
// 홈/최근추가된곡 화면만 체류시간(A/B 테스트 지표)을 잰다 — useScreenDwellTracking 참고
const DWELL_TRACKED_SCREENS: readonly PlaylistScreen[] = ['main', 'recent'];

interface PlaylistViewProps {
  onBack: () => void;
  // 기타 탭이 지금 화면에 보이는지 — 탭을 오가도 이 뷰는 마운트가 유지돼서(display:none) 인기차트가 "새로 마운트되는 시점"에
  // 재조회되지 않으므로, 이 값이 false→true로 바뀌는 시점을 트리거로 삼음(staleTime이 지났을 때만 실제 요청)
  isActive?: boolean;
  deepLinkTrackId?: string | null;
  onDeepLinkTrackIdHandled?: () => void;
  // 추천글 카드에서 공유한 링크의 게시글 id — 있으면 deepLinkTrackId의 게시글 모음 대신 이 글 위치(최근추가된곡/추천글 상세)로 보냄
  deepLinkPostId?: string | null;
  // 소식탭 배너에서 아티스트를 눌러 들어올 때 — 이 검색어로 검색 결과 화면을 바로 연다
  deepLinkSearchQuery?: string | null;
  onDeepLinkSearchQueryHandled?: () => void;
}

// 게시글을 눌렀을 때 최근추가된곡 화면으로 보내 스크롤할 최근 페이지 수(20곡씩) — 이보다 오래된 게시글은 단건 상세로 보냄
const RECENT_SCROLL_PAGE_LIMIT = 2;

export function PlaylistView({ onBack, isActive = true, deepLinkTrackId, onDeepLinkTrackIdHandled, deepLinkPostId, deepLinkSearchQuery, onDeepLinkSearchQueryHandled }: PlaylistViewProps) {
  const isApp = isNativeApp();
  const platform = getPlatform();
  const posthog = usePostHog();
  const queryClient = useQueryClient();

  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정 — docs/playlist-recent-songs-ab-test.md 참고
  const recentSongsVariant = useRecentSongsTapAreaVariant();
  // 소식탭 배너 딥링크로 마운트되면 첫 렌더부터 그 검색어/검색 화면으로 시작 — 마운트 후 effect로 옮기면 홈이 한 프레임 먼저 그려져 반짝임
  const [searchQuery, setSearchQuery] = useState(deepLinkSearchQuery ?? '');
  // 홈 미리보기·곡 배너는 최근추가된곡 화면과 같은 캐시(20개씩 페이지)의 앞부분을 씀 — 홈에서 받은 첫 페이지가 전체 보기에 그대로 이어짐
  const { songs: fetchedSongs, isLoading: isAllRecentSongsLoading, hasNextPage: hasNextRecentPage, isFetchingNextPage: isFetchingNextRecentPage, fetchNextPage: fetchNextRecentPage } = useRecentSongsInfinite();
  const songs = fetchedSongs ?? EMPTY_SONGS;
  // 홈 "최근 추가된 곡" 미리보기의 장르 필터
  // 최근 추가된 곡 화면과 상태(선택 + 칩 위치)를 공유해서, 홈에서 고른 장르가 그 화면에도 그대로 이어진다
  const [recentGenreFilter, setRecentGenreFilter] = useState<GenreFilterState>(EMPTY_GENRE_FILTER);
  // 장르를 고르면 전체 첫 페이지를 걸러내지 않고 서버에서 그 장르 곡만 받음 — 최근 추가된 곡 화면의 같은 장르 캐시와 공유(전체일 땐 위 쿼리와 같은 캐시)
  const { songs: genreSongs, isLoading: isGenreSongsLoading } = useRecentSongsInfinite(recentGenreFilter.selected[0]);
  const filteredRecentSongs = recentGenreFilter.selected.length > 0 ? (genreSongs ?? EMPTY_SONGS) : songs;
  const isRecentSongsLoading = recentGenreFilter.selected.length > 0 ? isGenreSongsLoading : isAllRecentSongsLoading;
  const { data: mySongs, isLoading: isMySongsLoading } = useMySongs();
  // 홈 미리보기와 인기차트 전체보기 화면이 같은 기간 필터를 공유
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('popular');
  const { data: chartData, isLoading: isChartLoading, isError: isChartError, refetch: refetchChart } = usePopularityChart(chartPeriod, isActive);
  // 홈 곡 배너는 현재 선택된 차트 칩과 무관하게 실시간·주간 전체 장르 TOP 10을 각각 사용한다.
  // 같은 queryKey가 겹치면 React Query가 요청과 캐시를 자동으로 공유한다.
  const { data: promoPopularChart, isLoading: isPromoPopularLoading } = usePopularityChart('popular', isActive);
  const { data: promoWeeklyChart, isLoading: isPromoWeeklyLoading } = usePopularityChart('weekly', isActive);
  const chartTracks = chartData?.tracks ?? [];
  // 인기차트 화면의 장르 필터 — 홈 미리보기에는 적용되지 않고(홈은 항상 전체 차트), 화면 안에서만 장르별 차트를 서버에서 받아옴
  const [chartGenreFilter, setChartGenreFilter] = useState<GenreFilterState>(EMPTY_GENRE_FILTER);
  // 하단 플로팅 플레이어 상태 + 재생 버튼 동작(handlePlay) — usePlaylistPlayer 참고
  const {
    playerRef,
    currentTrack,
    playingTrackId,
    playerHeight,
    handlePlay,
    handleClose: handlePlayerClose,
    handlePlaybackStateChange,
    handlePlayerHeightChange,
  } = usePlaylistPlayer(recentSongsVariant);

  // 최근추가된곡/추천한곡 화면의 그리드·리스트 뷰 모드(사용자가 토글로 고른 값) — 어느 경로로 들어오든 이 선택대로 열린다. 이 화면들은 게시글 상세로 갔다가
  // 뒤로가기로 돌아오면 통째로 리마운트돼서, PlaylistView(이 화면들을 드나들어도 유지됨)에 보관해뒀다가
  // 마지막으로 보던 모드를 그대로 복원함
  const [viewModes, setViewModes] = useState<Record<ListScreen, ViewMode>>({
    recent: 'grid',
    mySongs: 'grid',
  });
  const changeViewMode = (listScreen: ListScreen) => (mode: ViewMode) =>
    setViewModes((prev) => ({ ...prev, [listScreen]: mode }));
  
  // 에리카 플레이리스트가 홈, 그 위에 화면들이 스택처럼 쌓임 (예: 홈 → 최근추가된곡 → 곡추천하기)
  const [screenStack, setScreenStack] = useState<ScreenFrame[]>(
    deepLinkSearchQuery ? [{ name: 'main' }, { name: 'search' }] : [{ name: 'main' }],
  );
  const screen = screenStack[screenStack.length - 1];
  // 인기차트 화면용 차트 — 전체(장르 없음)이면 홈 미리보기와 같은 쿼리 키라 캐시를 공유하고, 장르를 고르면 그 장르 차트를 따로 받음
  const {
    data: screenChartData,
    isLoading: isScreenChartLoading,
    isError: isScreenChartError,
    refetch: refetchScreenChart,
  } = usePopularityChart(chartPeriod, isActive && screen.name === 'chart', chartGenreFilter.selected[0]);
  // "어떤 곡을 추천해볼까요?" 클릭 시 검색 결과 화면(빈 검색어라 보여줄 게 없음) 대신
  // 홈으로 돌아가면서 검색바에 바로 포커스를 줌 — PlaylistHomeView가 마운트될 때 한 번 소비
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);

  const pushScreen = useCallback((next: ScreenFrame) => {
    setScreenStack((prev) => [...prev, next]);
  }, []);

  // 게시글 모음의 "이 곡 추천하러 가기" 버튼처럼 특정 곡이 미리 채워진 채로 곡추천하기 화면에 들어갈 때 씀.
  // 파라미터가 스택 칸에 담겨서, prefill 없이 부르는 진입점(FAB 등)은 null로 쌓으면 끝 — 이전 값이 새지 않음
  const pushAddSong = useCallback((prefill?: TrackSummary, prefillQuery?: string) => {
    pushScreen({ name: 'addSong', prefillTrack: prefill ?? null, prefillQuery: prefillQuery ?? null });
  }, [pushScreen]);

  // 게시글 모음(trackPosts) 화면이 조회로 채운 곡 정보 — 딥링크로 들어오면 스택 칸의 track은 title 등이 비어 있어서
  // 화면이 resolve한 값을 따로 받아둠. FAB 클릭 시점에만 읽으면 돼서 state가 아니라 ref로 보관
  const resolvedTrackPostsTrackRef = useRef<TrackSummary | null>(null);
  const handleResolveTrackPostsTrack = useCallback((track: TrackSummary) => {
    resolvedTrackPostsTrackRef.current = track;
  }, []);

  // 검색 결과 화면 안에서 재검색해 바뀐 검색어 — FAB 클릭 시점에만 읽으면 돼서 ref로 보관
  const activeSearchQueryRef = useRef('');

  // 곡 추천하기 FAB — 게시글 모음 화면에서 누르면 그 곡이 미리 채워진 채로 곡추천하기 화면으로 이동, 그 외 화면은 빈 폼
  const handleAddSongFabClick = useCallback(() => {
    if (screen.name === 'trackPosts') {
      const resolved = resolvedTrackPostsTrackRef.current;
      pushAddSong(resolved?.trackId === screen.track.trackId ? resolved : screen.track);
      return;
    }
    // 검색 결과 화면에서는 지금 보고 있는 검색어로 곡 검색이 된 채로 들어감
    if (screen.name === 'search') {
      pushAddSong(undefined, activeSearchQueryRef.current || searchQuery);
      return;
    }
    if (screen.name === 'searchPosts') {
      pushAddSong(undefined, screen.query);
      return;
    }
    pushAddSong();
  }, [screen, pushAddSong, searchQuery]);

  // 검색 결과 화면에서 홈으로 돌아오면 홈 검색바를 비움 — 어떤 경로(뒤로가기·시스템 뒤로가기·홈 이동 버튼)로 와도 동일하게 처리.
  // useLayoutEffect라 페인트 전에 비워져서 이전 검색어가 한 프레임도 보이지 않음
  const prevScreenNameRef = useRef(screen.name);
  useLayoutEffect(() => {
    if (prevScreenNameRef.current === 'search' && screen.name === 'main') setSearchQuery('');
    prevScreenNameRef.current = screen.name;
  }, [screen.name]);

  // 인기차트 화면이 홈 카드로 찾아온 곡에 스크롤+강조를 마치면 대상을 비움 — 그대로 두면 곡 게시글을 보고 돌아올 때
  // 인기차트 화면이 다시 마운트되면서 같은 곡으로 또 스크롤·강조됨(홈 카드로 처음 들어온 때만 효과가 나와야 함)
  const consumeChartScrollTarget = useCallback(() => {
    setScreenStack((prev) => {
      const last = prev[prev.length - 1];
      return last.name === 'chart' && last.scrollTarget ? [...prev.slice(0, -1), { name: 'chart', scrollTarget: null }] : prev;
    });
  }, []);

  // 뒤로가기는 스택을 한 단계씩 pop — 어느 화면에서 들어왔는지와 무관하게 항상 바로 이전 화면으로 돌아감
  const popScreen = useCallback(() => {
    setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // 곡추천하기 등록 성공 — 어느 화면에서 곡추천하기로 들어왔든, 자기 곡이 잘 올라갔는지 바로
  // 볼 수 있게 최근추가된곡으로 보냄. addSong 프레임을 그대로 recent로 바꿔치기해서(push가 아님)
  // 뒤로가기를 누르면 addSong 이전 화면으로 돌아가지, addSong 폼으로 돌아가지 않음.
  // 곡을 추천하면 최근추가된곡 화면의 맨 위(방금 추천한 곡)를 1열로 보여줌 — 장르 필터가 걸려 있으면 새 곡이 안 보일 수 있어 전체로 되돌림
  const handleAddSongSuccess = useCallback(() => {
    setRecentGenreFilter((prev) => ({ ...prev, selected: [] }));
    setViewModes((prev) => ({ ...prev, recent: 'list' }));
    setScreenStack((prev) => [...prev.slice(0, -1), { name: 'recent', scrollTarget: null }]);
  }, []);

  // 홈에서 플레이리스트를 나가려 하면 항상 확인 팝업을 먼저 띄움 — 재생 중이면 나가는 순간 플레이어가 언마운트돼서
  // 듣던 곡이 끊기므로 그 안내를, 재생 중이 아니면 가볍게 한 번 더 묻는 문구를 보여줌(문구는 아래 팝업에서 분기)
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const requestExit = useCallback(() => setShowExitConfirm(true), []);

  const handleBack = useCallback(() => {
    if (showExitConfirm) {
      setShowExitConfirm(false); // 하드웨어 뒤로가기로 팝업만 닫음
    } else if (screenStack.length > 1) {
      popScreen();
    } else {
      requestExit();
    }
  }, [showExitConfirm, screenStack, popScreen, requestExit]);
  useBackHandler(handleBack);

  // 플레이리스트의 모든 API가 device_id를 요구해서, 화면 진입 시점에 무조건 익명 기기 식별자를 발급/재사용해둠
  // 인증 서버 요청 한도에 걸렸으면 어떤 API도 못 쓰므로, 안내 팝업을 띄우고 확인을 누르면 플레이리스트를 나감
  const [showRateLimitPopup, setShowRateLimitPopup] = useState(false);
  useEffect(() => {
    getOrCreateAnonymousUserId().catch((err) => {
      if (err instanceof AuthRateLimitError) setShowRateLimitPopup(true);
      else console.error('[PlaylistView] anonymous auth failed:', err);
    });
  }, []);

  // 화면(홈/최근추가된곡/곡추천하기)마다 스크롤 위치를 독립적으로 기억했다가 복원 + 홈/최근추가된곡
  // 체류시간(A/B 테스트 지표)을 PostHog로 캡처 — 로직 전체는 useScreenDwellTracking 참고
  const { scrollContainerRef } = useScreenDwellTracking({
    screen: screen.name,
    trackedScreens: DWELL_TRACKED_SCREENS,
    dwellProps: {
      variant: recentSongsVariant,
      ...(screen.name === 'recent' ? { view_mode: viewModes.recent } : {}),
    },
    // 홈에서 특정 카드를 눌러 최근추가된곡 화면의 그 카드 위치로 스크롤하려는 목표가 있으면,
    // 스크롤 위치를 되돌리지 않고 SongListScreen의 자체 스크롤(scrollIntoView)에 맡김 —
    // 안 그러면 이 훅이 곧바로 scrollTop을 0으로 되돌려서 그 스크롤을 무효화시킴
    skipScrollRestore: (screen.name === 'recent' || screen.name === 'mySongs' || screen.name === 'chart') && !!screen.scrollTarget,
  });

  // 홈/최근추가된곡/인기차트/저장한곡/내가추천한곡 화면에서 맨 위에서 아래로 당겨 새로고침 (인스타그램식). 같은 스크롤 컨테이너를 공유하므로 이 화면들에서만 켬
  const { pull, isRefreshing: isPullRefreshing, threshold: pullThreshold } = usePullToRefresh({
    containerRef: scrollContainerRef,
    onRefresh: () => {
      switch (screen.name) {
        case 'chart':
          return refetchScreenChart();
        // 최근추가된곡 화면은 전체 목록(무한 스크롤 캐시)과 홈 미리보기를 같이 새로고침
        case 'recent':
          return queryClient.refetchQueries({ queryKey: RECENT_SONGS_INFINITE_QUERY_KEY, type: 'active' });
        case 'liked':
          return queryClient.refetchQueries({ queryKey: LIKED_SONGS_QUERY_KEY, type: 'active' });
        case 'mySongs':
          return Promise.all([
            queryClient.refetchQueries({ queryKey: MY_SONGS_QUERY_KEY, type: 'active' }),
            queryClient.refetchQueries({ queryKey: MY_SONGS_INFINITE_QUERY_KEY, type: 'active' }),
          ]);
        default:
          // 홈 — 지금 마운트된 플레이리스트 쿼리(최근 추가/내가 추천/인기차트/아티스트 추천 미리보기)를 전부 새로고침
          return queryClient.refetchQueries({ queryKey: ['playlist'], type: 'active' });
      }
    },
    enabled: screen.name === 'main' || screen.name === 'recent' || screen.name === 'chart' || screen.name === 'liked' || screen.name === 'mySongs',
  });

  const handleSearchSubmit = useCallback(() => {
    if (!searchQuery.trim()) return;
    pushScreen({ name: 'search' });
  }, [searchQuery, pushScreen]);

  const handleSelectSearchTrack = useCallback((track: TrackSummary) => {
    pushScreen({ name: 'trackPosts', track });
  }, [pushScreen]);

  // 카카오 공유 등 딥링크로 넘어온 trackId를 한 번 적용해 그 곡의 게시글 모음으로 바로 이동시키고,
  // 부모(App.tsx)에 소비 완료를 알린다 (CampusMapView의 deepLinkChip과 동일한 방식). 아직 제목/가수명/
  // 앨범아트를 모르므로 빈 값으로 넘기고, TrackPostCollectionView가 useTrackPosts로 받아온 실제 값으로 채움
  useEffect(() => {
    if (!deepLinkTrackId || deepLinkPostId) return; // postId가 있으면 아래 effect가 처리
    handleSelectSearchTrack({ trackId: deepLinkTrackId, title: '', artist: '', albumArtUrl: '' });
    onDeepLinkTrackIdHandled?.();
  }, [deepLinkTrackId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 추천글 공유 링크: 게시글 카드를 눌렀을 때(handleSelectPost)와 같은 기준으로 분기 — 최근 RECENT_SCROLL_PAGE_LIMIT 페이지 안이면
  // 최근추가된곡에서 그 곡으로 스크롤, 더 오래됐으면 추천글 상세. 콜드 스타트면 최근추가된곡 캐시가 비어 있으니 첫 페이지 로딩이 끝나길 기다리고,
  // 필요한 만큼 페이지가 안 받아졌으면 이어서 받은 뒤 판단(조회 실패 등으로 못 받아도 추천글 상세로 폴백)
  useEffect(() => {
    if (!deepLinkPostId || isAllRecentSongsLoading || isFetchingNextRecentPage) return;
    const pages = queryClient.getQueryData<SongPagesData>(RECENT_SONGS_INFINITE_QUERY_KEY)?.pages.slice(0, RECENT_SCROLL_PAGE_LIMIT) ?? [];
    const found = pages.flatMap((page) => page.songs).find((song) => song.id === deepLinkPostId);
    if (!found && pages.length < RECENT_SCROLL_PAGE_LIMIT && hasNextRecentPage) {
      void fetchNextRecentPage();
      return;
    }
    if (found) {
      setRecentGenreFilter((prev) => ({ ...prev, selected: [] }));
      pushScreen({ name: 'recent', scrollTarget: found.trackId });
    } else {
      pushScreen({ name: 'postDetail', postId: deepLinkPostId });
    }
    onDeepLinkTrackIdHandled?.();
  }, [deepLinkPostId, isAllRecentSongsLoading, isFetchingNextRecentPage, hasNextRecentPage, fetchedSongs]); // eslint-disable-line react-hooks/exhaustive-deps

  // 소식탭 아티스트 배너 딥링크: 검색바에 그 이름을 채우고 검색 결과 화면을 연다. 이미 검색 결과 화면이면 쌓지 않고 검색어만 바꾼다
  useEffect(() => {
    if (!deepLinkSearchQuery) return;
    setSearchQuery(deepLinkSearchQuery);
    setScreenStack((prev) => (prev[prev.length - 1].name === 'search' ? prev : [...prev, { name: 'search' }]));
    onDeepLinkSearchQueryHandled?.();
  }, [deepLinkSearchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // 인기차트 리스트 클릭 — ChartTrack을 TrackSummary 형태로 변환해 동일한 TrackPostCollectionView로 이동
  const handleSelectChartSong = useCallback((track: ChartTrack) => {
    pushScreen({
      name: 'trackPosts',
      track: {
        trackId: track.trackId,
        title: track.title,
        artist: track.artist,
        albumArtUrl: track.albumArtUrl,
      },
    });
  }, [pushScreen]);

  // 게시글 목록(TrackPostCollectionView/SearchResultsView) 항목 클릭.
  // - 최근 추가된 곡 앞쪽 RECENT_SCROLL_PAGE_LIMIT 페이지(page 0~1, 최근 40곡. 장르 필터 없는 전체 캐시)에 있는 게시글: 최근추가된곡 화면으로 이동해 그 곡으로 스크롤 —
  //   목록 맨 위쪽이라 바로 찾을 수 있고, 주변 곡도 이어서 볼 수 있음.
  // - 그보다 오래된 게시글: 단건 상세(PostView, GET /songs/{id}). 최근추가된곡으로 보내면 아래 페이지까지 이어 불러와야 하고(그 사이 화면이 비어 보임),
  //   도착해도 목록 한참 아래라 위치 파악이 어려움.
  // - id가 없는 게시글(로컬 임시 곡)은 단건 조회를 못 하니 최근추가된곡 스크롤로 처리.
  // 최근추가된곡으로 갈 땐 장르 필터를 전체로 되돌림 — 걸어둔 장르에 이 곡이 안 걸리면 목록에 카드가 없어 스크롤이 안 되기 때문
  const handleSelectPost = useCallback((post: Song) => {
    const nearbySongs = queryClient.getQueryData<SongPagesData>(RECENT_SONGS_INFINITE_QUERY_KEY)?.pages.slice(0, RECENT_SCROLL_PAGE_LIMIT).flatMap((page) => page.songs);
    const isNearby = !!post.id && !!nearbySongs?.some((song) => song.id === post.id);
    if (post.id && !isNearby) {
      pushScreen({ name: 'postDetail', postId: post.id });
      return;
    }
    setRecentGenreFilter((prev) => ({ ...prev, selected: [] }));
    pushScreen({ name: 'recent', scrollTarget: post.trackId });
  }, [pushScreen, queryClient]);

  // 홈의 하단 "더보기"는 미리보기 마지막 곡 위치까지 부드럽게 내려간 뒤 이어서 목록을 보게 한다.
  // 헤더 화살표·빈 상태 등 다른 진입점은 기존처럼 목록 맨 위부터 보여준다.
  // A안/B안 사이 이견 없이 병합하는 개선이라 A/B 테스트 대상은 아니지만, "홈 → 최근추가된곡 진입" CTR 지표는 여기서 같이 캡처함
  const handleShowAllRecent = useCallback((scrollToLastPreview = false) => {
    posthog?.capture('playlist_recent_show_all_clicked', { variant: recentSongsVariant, trigger: scrollToLastPreview ? 'more_button' : 'header_arrow' });
    const previewSongs = filteredRecentSongs.slice(0, RECENT_SONGS_LIMIT);
    const lastPreviewTrackId = previewSongs[previewSongs.length - 1]?.trackId ?? null;
    // 특정 곡을 누른 게 아니라 미리보기 끝 위치를 이어 보여주는 것이므로 카드 강조는 하지 않음
    pushScreen({ name: 'recent', scrollTarget: scrollToLastPreview ? lastPreviewTrackId : null, highlight: false });
  }, [pushScreen, songs, posthog, recentSongsVariant]);

  // 홈의 최근 추가된 곡 카드 클릭 — 전체보기 화면으로 이동하면서 누른 카드 위치로 바로 스크롤.
  const handleSelectRecentSong = useCallback((song: Song) => {
    posthog?.capture('playlist_recent_preview_navigate', { variant: recentSongsVariant, track_id: song.trackId });
    pushScreen({ name: 'recent', scrollTarget: song.trackId });
  }, [pushScreen, posthog, recentSongsVariant]);

  // 홈 곡 배너에서는 최근 곡 화면을 열고 해당 곡을 가운데로 이동한다.
  // 장르 필터도 "전체"로 되돌림 — 사용자가 걸어둔 장르에 이 곡이 안 걸리면 목록에 카드가 없어 스크롤이 안 되기 때문(handleSelectPost와 같은 이유)
  const handleSelectRecentPromo = useCallback((song: Song) => {
    setRecentGenreFilter((prev) => ({ ...prev, selected: [] }));
    pushScreen({ name: 'recent', scrollTarget: song.trackId });
  }, [pushScreen]);

  const handleSelectChartPromo = useCallback((track: ChartTrack, period: Extract<ChartPeriod, 'popular' | 'weekly'>) => {
    setChartPeriod(period);
    setChartGenreFilter((prev) => ({ ...prev, selected: [] }));
    pushScreen({ name: 'chart', scrollTarget: track.trackId });
  }, [pushScreen]);

  const visibleSongs = filteredRecentSongs.slice(0, RECENT_SONGS_LIMIT);
  const visibleChart = chartTracks.slice(0, CHART_PREVIEW_LIMIT);

  // AddSongFab은 곡추천하기 화면(screen === 'addSong')만 빼고 항상 떠 있어서, 그 화면이 아니면
  // 여백 계산에 FAB의 실제 크기·간격(AddSongFab.tsx가 export하는 값과 항상 일치)까지 더해야
  // 목록 마지막 항목이 FAB에 가려지지 않는다
  const FAB_GAP_ABOVE_CONTENT = 12;
  const isFabVisible = screen.name !== 'addSong';
  const searchFabExtra = screen.name === 'recent' ? SEARCH_FAB_STACK_PX : 0; // 최근추가된곡 화면은 검색 FAB이 한 칸 더 쌓임
  const bottomSpace = isFabVisible
    ? playerHeight > 0
      ? playerHeight + PLAYER_GAP_PX + FAB_HEIGHT_PX + FAB_GAP_ABOVE_CONTENT + searchFabExtra // 플레이어 위에 뜬 FAB까지 감안
      : FAB_CLOSED_BOTTOM_PX + FAB_HEIGHT_PX + FAB_GAP_ABOVE_CONTENT + searchFabExtra // FAB 기본 위치(플레이어 없을 때)까지 감안
    : playerHeight > 0 ? playerHeight + 4 : 4;

  return (
    <div
      ref={scrollContainerRef}
      className="playlist-root fixed inset-0 z-[1001] overflow-y-auto overflow-x-hidden mx-auto w-full max-w-app px-4 py-4"
      style={{
        backgroundColor: '#FFFFFF',
        animation: 'fadeIn 0.25s ease-out',
        paddingTop: `calc(1.5rem + ${isApp && platform === 'android' ? 'env(safe-area-inset-top, 28px)' : 'env(safe-area-inset-top)'})`,
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        '--playlist-bottom-space': `${bottomSpace}px`,
        // 하단 플로팅 플레이어 실측 높이(닫힘이면 0) — 좋아요 토스트처럼 플레이어 위에 떠야 하는 요소가 읽음
        '--playlist-player-height': `${playerHeight}px`,
      } as CSSProperties}
    >
      {/* 당겨서 새로고침 인디케이터 — 당기는 만큼 내려오고, 기준 거리를 넘으면 회전 */}
      {(pull > 0 || isPullRefreshing) && (
        <div
          className="fixed left-1/2 z-[1100] pointer-events-none"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            transform: `translate(-50%, ${pull}px)`,
            opacity: Math.min(pull / pullThreshold, 1),
            transition: pull === 0 || isPullRefreshing ? 'transform 0.2s ease-out, opacity 0.2s' : undefined,
          }}
        >
          <div className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.12)] flex items-center justify-center">
            <RefreshCw
              size={16}
              strokeWidth={2.2}
              className={isPullRefreshing ? 'animate-spin text-primary' : 'text-primary'}
              style={isPullRefreshing ? undefined : { transform: `rotate(${(pull / pullThreshold) * 270}deg)` }}
            />
          </div>
        </div>
      )}

      <div key={screen.name} style={{ animation: 'fadeIn 0.25s ease-out' }}>
        {screen.name === 'recent' ? (
          <RecentSongsView
            onBack={popScreen}
            onPlay={(song) => handlePlay(song, 'recent_full_list')}
            onShowAddSong={() => pushAddSong()}
            onShowSearch={() => {
              setAutoFocusSearch(true);
              setScreenStack([{ name: 'main' }]);
            }}
            onSelectTrack={handleSelectSearchTrack}
            scrollToTrackId={screen.scrollTarget}
            highlightScrollTarget={screen.highlight !== false}
            currentTrackId={playingTrackId}
            viewMode={viewModes.recent}
            onViewModeChange={changeViewMode('recent')}
            playButtonVariant={recentSongsVariant}
            genreFilter={recentGenreFilter}
            onGenreFilterChange={setRecentGenreFilter}
          />
        ) : screen.name === 'addSong' ? (
          <RecommendSongView
            onBack={popScreen}
            onSubmitSuccess={handleAddSongSuccess}
            playerHeight={playerHeight}
            onPlay={handlePlay}
            currentTrackId={playingTrackId}
            prefillTrack={screen.prefillTrack}
            prefillQuery={screen.prefillQuery}
          />
        ) : screen.name === 'search' ? (
          <SearchResultsView
            key={searchQuery} // 이미 검색 결과 화면인 채로 딥링크로 검색어가 바뀌면, 내부 activeQuery(처음 진입 때만 query로 초기화)가 따라가도록 새로 마운트
            query={searchQuery}
            onBack={popScreen}
            onShowMorePosts={(q) => pushScreen({ name: 'searchPosts', query: q })}
            onShowRecent={() => handleShowAllRecent()}
            recentSongs={songs}
            isRecentSongsLoading={isRecentSongsLoading}
            onSelectRecentSong={handleSelectRecentSong}
            recentSongsVariant={recentSongsVariant}
            onSelectTrack={handleSelectSearchTrack}
            onSelectPost={handleSelectPost}
            onPlay={handlePlay}
            currentTrackId={playingTrackId}
            onRecommendTrack={pushAddSong}
            onActiveQueryChange={(q) => { activeSearchQueryRef.current = q; }}
          />
        ) : screen.name === 'searchPosts' ? (
          <SearchPostsView
            query={screen.query}
            onBack={popScreen}
            onSelectPost={handleSelectPost}
            onPlay={handlePlay}
            currentTrackId={playingTrackId}
          />
        ) : screen.name === 'trackPosts' ? (
          <TrackPostCollectionView
            track={screen.track}
            onBack={popScreen}
            onSelectPost={handleSelectPost}
            onPlay={() => handlePlay(screen.track)}
            isPlaying={screen.track.trackId === playingTrackId}
            onResolveTrack={handleResolveTrackPostsTrack}
            onShowRecent={() => handleShowAllRecent()}
            recentSongs={songs}
            isRecentSongsLoading={isRecentSongsLoading}
            onSelectRecentSong={handleSelectRecentSong}
            onPlayTrack={handlePlay}
            currentTrackId={playingTrackId}
            recentSongsVariant={recentSongsVariant}
          />
        ) : screen.name === 'postDetail' ? (
          <PostView
            postId={screen.postId}
            onBack={popScreen}
            onPlay={handlePlay}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
            playButtonVariant={recentSongsVariant}
            onShowRecent={() => handleShowAllRecent()}
            recentSongs={songs}
            isRecentSongsLoading={isRecentSongsLoading}
            onSelectRecentSong={handleSelectRecentSong}
          />
        ) : screen.name === 'chart' ? (
          <ChartView
            chart={screenChartData?.tracks ?? EMPTY_CHART}
            isLoading={isScreenChartLoading}
            isError={isScreenChartError}
            onRetry={() => void refetchScreenChart()}
            scrollToTrackId={screen.scrollTarget}
            onScrollTargetConsumed={consumeChartScrollTarget}
            genreFilter={chartGenreFilter}
            onGenreFilterChange={setChartGenreFilter}
            chartPeriod={chartPeriod}
            onChangePeriod={setChartPeriod}
            onBack={popScreen}
            onShowRecent={() => handleShowAllRecent()}
            onPlay={handlePlay}
            onShowPosts={handleSelectChartSong}
            currentTrackId={playingTrackId}
          />
        ) : screen.name === 'myActivity' ? (
          <MyPageView
            onBack={popScreen}
            onShowLiked={() => pushScreen({ name: 'liked' })}
            onShowMySongs={() => pushScreen({ name: 'mySongs', scrollTarget: null })}
          />
        ) : screen.name === 'liked' ? (
          <LikedSongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushAddSong()}
            onShowRecent={() => handleShowAllRecent()}
            recentSongs={songs}
            isRecentSongsLoading={isRecentSongsLoading}
            onSelectRecentSong={handleSelectRecentSong}
            recentSongsVariant={recentSongsVariant}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
          />
        ) : screen.name === 'mySongs' ? (
          <MySongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushAddSong()}
            onSelectTrack={handleSelectSearchTrack}
            scrollToTrackId={screen.scrollTarget}
            currentTrackId={playingTrackId}
            viewMode={viewModes.mySongs}
            onViewModeChange={changeViewMode('mySongs')}
          />
        ) : (
          <PlaylistHomeView
            onBack={requestExit}
            isActive={isActive}
            visibleSongs={visibleSongs}
            promoRecentSongs={songs.slice(0, 10)}
            recentGenreFilter={recentGenreFilter}
            onChangeRecentGenreFilter={setRecentGenreFilter}
            isRecentSongsLoading={isRecentSongsLoading}
            visibleChart={visibleChart}
            isChartLoading={isChartLoading}
            chartPeriod={chartPeriod}
            onChangeChartPeriod={setChartPeriod}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSubmitSearch={handleSearchSubmit}
            onShowAllRecent={handleShowAllRecent}
            onSelectRecentSong={handleSelectRecentSong}
            recentSongsVariant={recentSongsVariant}
            onPlayTrack={(track) => handlePlay(track, 'home_preview')}
            currentTrackId={playingTrackId}
            onShowAllChart={(scrollTarget) => {
              // 홈 미리보기는 항상 전체 차트라, 인기차트 화면도 장르를 전체로 되돌려서 연다
              setChartGenreFilter((prev) => ({ ...prev, selected: [] }));
              pushScreen({ name: 'chart', scrollTarget: scrollTarget ?? null });
            }}
            onShowLiked={() => pushScreen({ name: 'liked' })}
            onShowAddSong={() => pushAddSong()}
            mySongs={mySongs ?? EMPTY_SONGS}
            isMySongsLoading={isMySongsLoading}
            onShowAllMySongs={() => pushScreen({ name: 'mySongs', scrollTarget: null })}
            onSelectMySong={(song) => pushScreen({ name: 'mySongs', scrollTarget: song.trackId })}
            promoPopularTracks={(promoPopularChart?.tracks ?? EMPTY_CHART).slice(0, 10)}
            promoWeeklyTracks={(promoWeeklyChart?.tracks ?? EMPTY_CHART).slice(0, 10)}
            isTrackPromosLoading={isRecentSongsLoading || isPromoPopularLoading || isPromoWeeklyLoading}
            onSelectRecentPromo={handleSelectRecentPromo}
            onSelectChartPromo={handleSelectChartPromo}
            autoFocusSearch={autoFocusSearch}
            onAutoFocusSearchConsumed={() => setAutoFocusSearch(false)}
          />
        )}
      </div>

      {/* 곡 추가 FAB: 곡추천하기 화면에서는 숨김. 플레이어 열림/닫힘에 따라 위치가 애니메이션으로 이동함 */}
      {screen.name !== 'addSong' && (
        <AddSongFab onClick={handleAddSongFabClick} playerHeight={playerHeight} showCoachmark={screen.name === 'main'} />
      )}
      {/* 곡 검색하기 FAB: 최근추가된곡 화면 전용 — 곡 추천하기 FAB 위에 쌓임. 누르면 검색어 없이 검색 화면(검색바에 포커스)으로 이동 */}
      {screen.name === 'recent' && (
        <SearchSongFab
          playerHeight={playerHeight}
          onClick={() => {
            setSearchQuery('');
            pushScreen({ name: 'search' });
          }}
        />
      )}

      {/* 플레이리스트를 나가려 할 때 확인 팝업(재생 중이면 음악이 멈춘다는 안내) */}
      {showExitConfirm && (
        <ConfirmPopup
          compact
          buttons={
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 h-11 rounded-full text-[15px] font-bold text-text-sub bg-slate-100 active:scale-[0.97] transition-transform"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onBack();
                }}
                className="flex-1 h-11 rounded-full text-[15px] font-bold text-white bg-playlist-primary active:scale-[0.97] transition-transform"
              >
                나가기
              </button>
            </div>
          }
        >
          <p className="text-[16px] font-bold text-text-main mb-1 text-center">플리를 종료하시겠습니까?</p>
          <p className="text-[13px] font-medium text-text-hint mb-3.5 text-center">
            {playingTrackId ? '종료하면 재생 중인 음악이 정지돼요.' : '하냥이들의 새로운 추천곡이 기다리고 있어요!'}
          </p>
        </ConfirmPopup>
      )}

      {/* 인증 요청 한도 초과 안내 — 확인하면 플레이리스트를 나감 */}
      {showRateLimitPopup && (
        <ConfirmPopup
          compact
          buttons={
            <button
              onClick={() => {
                setShowRateLimitPopup(false);
                onBack();
              }}
              className="w-full h-11 rounded-full text-[15px] font-bold text-white bg-playlist-primary active:scale-[0.97] transition-transform"
            >
              확인
            </button>
          }
        >
          <p className="text-[16px] font-bold text-text-main mb-1 text-center">요청이 너무 많아요</p>
          <p className="text-[13px] font-medium text-text-hint mb-3.5 text-center">
            잠시 후에 다시 시도해주세요.
          </p>
        </ConfirmPopup>
      )}

      {/* 플로팅 Spotify 플레이어*/}
      <FloatingSpotifyPlayer
        ref={playerRef}
        song={currentTrack}
        onClose={handlePlayerClose}
        onHeightChange={handlePlayerHeightChange}
        onPlaybackStateChange={handlePlaybackStateChange}
      />
    </div>
  );
}
