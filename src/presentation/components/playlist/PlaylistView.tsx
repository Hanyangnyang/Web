import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { usePostHog } from 'posthog-js/react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/playlist/usePullToRefresh';
import { useBackHandler } from '../../hooks/useBackHandler';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { FloatingSpotifyPlayer } from './shared/FloatingSpotifyPlayer';
import { AddSongFab, FAB_HEIGHT_PX, FAB_CLOSED_BOTTOM_PX, PLAYER_GAP_PX } from './shared/AddSongFab';
import { RecommendSongView } from './recommendSong/RecommendSongView';
import { RecentSongsView } from './recentSongs/RecentSongsView';
import { SearchResultsView } from './searchResults/SearchResultsView';
import { TrackPostCollectionView } from './trackPostCollection/TrackPostCollectionView';
import { PostView } from './post/PostView';
import { MyPageView } from './myPage/MyPageView';
import { LikedSongsView } from './likedSongs/LikedSongsView';
import { MySongsView } from './mySongs/MySongsView';
import { PlaylistHomeView } from './home/PlaylistHomeView';
import { type Song, type ChartPeriod, type TrackSummary } from './playlistTypes';
import { ChartView } from './chart/ChartView';
import { type ChartTrack } from '../../../domain/entities/PopularityChart.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { useRecentSongs } from '../../hooks/playlist/useRecentSongs.js';
import { usePlaylistPlayer } from '../../hooks/playlist/usePlaylistPlayer';
import { usePopularityChart } from '../../hooks/playlist/usePopularityChart.js';
import { useRecentSongsTapAreaVariant } from '../../hooks/playlist/usePlaylistExperiment';
import { useScreenDwellTracking } from '../../hooks/playlist/useScreenDwellTracking.js';

const RECENT_SONGS_LIMIT = 7;
const CHART_PREVIEW_LIMIT = 10;
const EMPTY_SONGS: Song[] = []; // 데이터 도착 전 fallback — 매 렌더마다 새 [] 를 만들면 songs를 deps로 쓰는 콜백이 계속 재생성되므로 모듈 상수로 고정

// 화면 스택의 한 칸 = 화면 이름 + 그 화면이 쓰는 파라미터 
type ScreenFrame =
  | { name: 'main' }
  | { name: 'recent'; scrollTarget: string | null } // scrollTarget: 홈의 최근추가된곡 섹션의 곡 카드를 눌렀을때, 해당하는 곡으로 스크롤하기 위함 
  // prefillTrack: 게시글 모음에서 FAB을 누르는 등 특정 곡이 미리 채워진 채로 진입할 때의 곡
  | { name: 'addSong'; prefillTrack: TrackSummary | null }
  | { name: 'search' }
  // track: 검색 결과·인기차트 등에서 눌러 선택된 곡 — TrackPostCollectionView(곡 단위 게시글 모음)에 넘김
  | { name: 'trackPosts'; track: TrackSummary }
  // postId: 게시글 목록에서 눌러 선택된 게시글 id — PostView가 GET /api/v1/playlist/songs/{id}로 상세 조회
  | { name: 'postDetail'; postId: string }
  | { name: 'chart' }
  | { name: 'myActivity' }
  | { name: 'liked' }
  | { name: 'mySongs' };
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
}

export function PlaylistView({ onBack, isActive = true, deepLinkTrackId, onDeepLinkTrackIdHandled }: PlaylistViewProps) {
  const isApp = isNativeApp();
  const platform = getPlatform();
  const posthog = usePostHog();

  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정 — docs/playlist-recent-songs-ab-test.md 참고
  const recentSongsVariant = useRecentSongsTapAreaVariant();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: fetchedSongs, isLoading: isRecentSongsLoading, refetch: refetchRecentSongs } = useRecentSongs();
  const songs = fetchedSongs ?? EMPTY_SONGS;

  // 홈 미리보기와 인기차트 전체보기 화면이 같은 기간 필터를 공유
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('popular');
  const { data: chartData, isLoading: isChartLoading, isError: isChartError, refetch: refetchChart } = usePopularityChart(chartPeriod, isActive);
  const chartTracks = chartData?.tracks ?? [];
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

  // 최근추가된곡/저장한곡/추천한곡 화면의 그리드·리스트 뷰 모드 — 이 화면들은 게시글 상세로 갔다가
  // 뒤로가기로 돌아오면 통째로 리마운트돼서, PlaylistView(이 화면들을 드나들어도 유지됨)에 보관해뒀다가
  // 마지막으로 보던 모드를 그대로 복원함
  const [viewModes, setViewModes] = useState<Record<ListScreen, ViewMode>>({
    recent: 'grid',
    mySongs: 'grid',
  });
  const changeViewMode = (listScreen: ListScreen) => (mode: ViewMode) =>
    setViewModes((prev) => ({ ...prev, [listScreen]: mode }));
  
  // 에리카 플레이리스트가 홈, 그 위에 화면들이 스택처럼 쌓임 (예: 홈 → 최근추가된곡 → 곡추천하기)
  const [screenStack, setScreenStack] = useState<ScreenFrame[]>([{ name: 'main' }]);
  const screen = screenStack[screenStack.length - 1];
  // "어떤 곡을 추천해볼까요?" 클릭 시 검색 결과 화면(빈 검색어라 보여줄 게 없음) 대신
  // 홈으로 돌아가면서 검색바에 바로 포커스를 줌 — PlaylistHomeView가 마운트될 때 한 번 소비
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);

  // PlaylistView 자체는 최근추가된곡 화면을 드나들어도 마운트가 유지돼서, react-query의
  // staleTime이 지나 있어도 "새로 마운트되는 시점" 트리거가 없어 자동으로 재조회되지 않았음.
  // 그래서 이 화면에 들어오는 시점 자체를 트리거로 삼아 직접 refetch — 주의: refetch()는 staleTime과 무관하게
  // 항상 요청을 보냄(실측 확인). useRecentSongs가 staleTime: 0이라 "화면 진입 때마다 최신으로 받기"와 같은 뜻이라 지금은 의도대로임.
  // 나중에 staleTime을 늘리면 이 refetch가 그 값을 무시하게 되니, 그때는 인기차트처럼 enabled 토글 방식으로 바꿔야 함
  useEffect(() => {
    if (screen.name === 'recent') refetchRecentSongs();
  }, [screen.name, refetchRecentSongs]);

  const pushScreen = useCallback((next: ScreenFrame) => {
    setScreenStack((prev) => [...prev, next]);
  }, []);

  // 게시글 모음의 "이 곡 추천하러 가기" 버튼처럼 특정 곡이 미리 채워진 채로 곡추천하기 화면에 들어갈 때 씀.
  // 파라미터가 스택 칸에 담겨서, prefill 없이 부르는 진입점(FAB 등)은 null로 쌓으면 끝 — 이전 값이 새지 않음
  const pushAddSong = useCallback((prefill?: TrackSummary) => {
    pushScreen({ name: 'addSong', prefillTrack: prefill ?? null });
  }, [pushScreen]);

  // 게시글 모음(trackPosts) 화면이 조회로 채운 곡 정보 — 딥링크로 들어오면 스택 칸의 track은 title 등이 비어 있어서
  // 화면이 resolve한 값을 따로 받아둠. FAB 클릭 시점에만 읽으면 돼서 state가 아니라 ref로 보관
  const resolvedTrackPostsTrackRef = useRef<TrackSummary | null>(null);
  const handleResolveTrackPostsTrack = useCallback((track: TrackSummary) => {
    resolvedTrackPostsTrackRef.current = track;
  }, []);

  // 곡 추천하기 FAB — 게시글 모음 화면에서 누르면 그 곡이 미리 채워진 채로 곡추천하기 화면으로 이동, 그 외 화면은 빈 폼
  const handleAddSongFabClick = useCallback(() => {
    if (screen.name === 'trackPosts') {
      const resolved = resolvedTrackPostsTrackRef.current;
      pushAddSong(resolved?.trackId === screen.track.trackId ? resolved : screen.track);
      return;
    }
    pushAddSong();
  }, [screen, pushAddSong]);

  // 뒤로가기는 스택을 한 단계씩 pop — 어느 화면에서 들어왔는지와 무관하게 항상 바로 이전 화면으로 돌아감
  const popScreen = useCallback(() => {
    setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // 곡추천하기 등록 성공 — 어느 화면에서 곡추천하기로 들어왔든, 자기 곡이 잘 올라갔는지 바로
  // 볼 수 있게 최근추가된곡으로 보냄. addSong 프레임을 그대로 recent로 바꿔치기해서(push가 아님)
  // 뒤로가기를 누르면 addSong 이전 화면으로 돌아가지, addSong 폼으로 돌아가지 않음
  const handleAddSongSuccess = useCallback(() => {
    setScreenStack((prev) => [...prev.slice(0, -1), { name: 'recent', scrollTarget: null }]);
  }, []);

  const handleBack = useCallback(() => {
    if (screenStack.length > 1) {
      popScreen();
    } else {
      onBack();
    }
  }, [screenStack, popScreen, onBack]);
  useBackHandler(handleBack);

  // 플레이리스트의 모든 API가 device_id를 요구해서, 화면 진입 시점에 무조건 익명 기기 식별자를 발급/재사용해둠
  useEffect(() => {
    getOrCreateAnonymousUserId().catch((err) => console.error('[PlaylistView] anonymous auth failed:', err));
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
    skipScrollRestore: screen.name === 'recent' && !!screen.scrollTarget,
  });

  // 최근추가된곡 화면에서 맨 위에서 아래로 당겨 새로고침 (인스타그램식). 같은 스크롤 컨테이너를 공유하므로 이 화면에서만 켬
  const { pull, isRefreshing: isPullRefreshing, threshold: pullThreshold } = usePullToRefresh({
    containerRef: scrollContainerRef,
    onRefresh: () => refetchRecentSongs(),
    enabled: screen.name === 'recent',
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
    if (!deepLinkTrackId) return;
    handleSelectSearchTrack({ trackId: deepLinkTrackId, title: '', artist: '', albumArtUrl: '' });
    onDeepLinkTrackIdHandled?.();
  }, [deepLinkTrackId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 게시글 목록(TrackPostCollectionView/SearchResultsView) 항목 클릭 — 기획 단계에서 게시글 상세(postDetail/PostView)를
  // 쓰지 않기로 해서, 최근추가된곡 화면으로 이동하면서 그 곡 위치로 스크롤함(홈의 최근 추가된 곡 카드 클릭과 같은 방식).
  // postDetail 화면/PostView 코드는 그대로 남겨둠 — 다시 쓰려면 아래를 pushScreen({ name: 'postDetail', postId: post.id })로 되돌리면 됨.
  // 주의: 최근추가된곡 목록은 최신 50개만 받아서, 그보다 오래된 게시글이면 해당 카드가 없어 스크롤 없이 목록 맨 위로 열림
  // 게시글 전문을 바로 읽을 수 있게 무조건 1열(리스트)로 열림 — 2열이었어도 여기서 1열로 바꿈(이후 토글 버튼으로 다시 2열 전환 가능)
  const handleSelectPost = useCallback((post: Song) => {
    setViewModes((prev) => ({ ...prev, recent: 'list' }));
    pushScreen({ name: 'recent', scrollTarget: post.trackId });
  }, [pushScreen]);

  // 홈의 하단 "더보기"는 미리보기 마지막 곡 위치까지 부드럽게 내려간 뒤 이어서 목록을 보게 한다.
  // 헤더 화살표·빈 상태 등 다른 진입점은 기존처럼 목록 맨 위부터 보여준다.
  // A안/B안 사이 이견 없이 병합하는 개선이라 A/B 테스트 대상은 아니지만, "홈 → 최근추가된곡 진입" CTR 지표는 여기서 같이 캡처함
  const handleShowAllRecent = useCallback((scrollToLastPreview = false) => {
    posthog?.capture('playlist_recent_show_all_clicked', { variant: recentSongsVariant, trigger: scrollToLastPreview ? 'more_button' : 'header_arrow' });
    const previewSongs = songs.slice(0, RECENT_SONGS_LIMIT);
    const lastPreviewTrackId = previewSongs[previewSongs.length - 1]?.trackId ?? null;
    pushScreen({ name: 'recent', scrollTarget: scrollToLastPreview ? lastPreviewTrackId : null });
  }, [pushScreen, songs, posthog, recentSongsVariant]);

  // 홈의 최근 추가된 곡 카드 클릭 — 전체보기 화면으로 이동하면서 누른 카드 위치로 바로 스크롤
  const handleSelectRecentSong = useCallback((song: Song) => {
    posthog?.capture('playlist_recent_preview_navigate', { variant: recentSongsVariant, track_id: song.trackId });
    pushScreen({ name: 'recent', scrollTarget: song.trackId });
  }, [pushScreen, posthog, recentSongsVariant]);

  const visibleSongs = songs.slice(0, RECENT_SONGS_LIMIT);
  const visibleChart = chartTracks.slice(0, CHART_PREVIEW_LIMIT);

  // AddSongFab은 곡추천하기 화면(screen === 'addSong')만 빼고 항상 떠 있어서, 그 화면이 아니면
  // 여백 계산에 FAB의 실제 크기·간격(AddSongFab.tsx가 export하는 값과 항상 일치)까지 더해야
  // 목록 마지막 항목이 FAB에 가려지지 않는다
  const FAB_GAP_ABOVE_CONTENT = 12;
  const isFabVisible = screen.name !== 'addSong';
  const bottomSpace = isFabVisible
    ? playerHeight > 0
      ? playerHeight + PLAYER_GAP_PX + FAB_HEIGHT_PX + FAB_GAP_ABOVE_CONTENT // 플레이어 위에 뜬 FAB까지 감안
      : FAB_CLOSED_BOTTOM_PX + FAB_HEIGHT_PX + FAB_GAP_ABOVE_CONTENT // FAB 기본 위치(플레이어 없을 때)까지 감안
    : playerHeight > 0 ? playerHeight + 4 : 4;

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-[1001] overflow-y-auto overflow-x-hidden mx-auto w-full max-w-app px-4 py-4"
      style={{
        backgroundColor: '#FFFFFF',
        animation: 'fadeIn 0.25s ease-out',
        ...(isApp ? {
          paddingTop: `calc(1.5rem + ${platform === 'ios' ? 'env(safe-area-inset-top)' : 'env(safe-area-inset-top, 28px)'})`,
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        } : {}),
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
              className={isPullRefreshing ? 'animate-spin text-playlist-accent' : 'text-text-main'}
              style={isPullRefreshing ? undefined : { transform: `rotate(${(pull / pullThreshold) * 270}deg)` }}
            />
          </div>
        </div>
      )}

      <div key={screen.name} style={{ animation: 'fadeIn 0.25s ease-out' }}>
        {screen.name === 'recent' ? (
          <RecentSongsView
            songs={songs}
            onBack={popScreen}
            onPlay={(song) => handlePlay(song, 'recent_full_list')}
            onShowAddSong={() => pushAddSong()}
            onShowSearch={() => {
              setAutoFocusSearch(true);
              setScreenStack([{ name: 'main' }]);
            }}
            onSelectTrack={handleSelectSearchTrack}
            scrollToTrackId={screen.scrollTarget}
            currentTrackId={playingTrackId}
            viewMode={viewModes.recent}
            onViewModeChange={changeViewMode('recent')}
            playButtonVariant={recentSongsVariant}
          />
        ) : screen.name === 'addSong' ? (
          <RecommendSongView
            onBack={popScreen}
            onSubmitSuccess={handleAddSongSuccess}
            playerHeight={playerHeight}
            onPlay={handlePlay}
            currentTrackId={playingTrackId}
            prefillTrack={screen.prefillTrack}
          />
        ) : screen.name === 'search' ? (
          <SearchResultsView
            query={searchQuery}
            onBack={popScreen}
            onSelectTrack={handleSelectSearchTrack}
            onSelectPost={handleSelectPost}
            onPlay={handlePlay}
            currentTrackId={playingTrackId}
            onRecommendTrack={pushAddSong}
          />
        ) : screen.name === 'trackPosts' ? (
          <TrackPostCollectionView
            track={screen.track}
            onBack={popScreen}
            onSelectPost={handleSelectPost}
            onPlay={() => handlePlay(screen.track)}
            isPlaying={screen.track.trackId === playingTrackId}
            onResolveTrack={handleResolveTrackPostsTrack}
          />
        ) : screen.name === 'postDetail' ? (
          <PostView
            postId={screen.postId}
            onBack={popScreen}
            onPlay={handlePlay}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
          />
        ) : screen.name === 'chart' ? (
          <ChartView
            chart={chartTracks}
            isLoading={isChartLoading}
            isError={isChartError}
            onRetry={() => void refetchChart()}
            chartPeriod={chartPeriod}
            onChangePeriod={setChartPeriod}
            onBack={popScreen}
            onShowRecent={handleShowAllRecent}
            onPlay={handlePlay}
            onShowPosts={handleSelectChartSong}
            currentTrackId={playingTrackId}
          />
        ) : screen.name === 'myActivity' ? (
          <MyPageView
            onBack={popScreen}
            onShowLiked={() => pushScreen({ name: 'liked' })}
            onShowMySongs={() => pushScreen({ name: 'mySongs' })}
          />
        ) : screen.name === 'liked' ? (
          <LikedSongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushAddSong()}
            onShowRecent={handleShowAllRecent}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
          />
        ) : screen.name === 'mySongs' ? (
          <MySongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushAddSong()}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
            viewMode={viewModes.mySongs}
            onViewModeChange={changeViewMode('mySongs')}
          />
        ) : (
          <PlaylistHomeView
            onBack={onBack}
            visibleSongs={visibleSongs}
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
            onShowAllChart={() => pushScreen({ name: 'chart' })}
            onShowPosts={handleSelectChartSong}
            onShowMyActivity={() => pushScreen({ name: 'myActivity' })}
            onShowAddSong={() => pushAddSong()}
            autoFocusSearch={autoFocusSearch}
            onAutoFocusSearchConsumed={() => setAutoFocusSearch(false)}
          />
        )}
      </div>

      {/* 곡 추가 FAB: 곡추천하기 화면에서는 숨김. 플레이어 열림/닫힘에 따라 위치가 애니메이션으로 이동함 */}
      {screen.name !== 'addSong' && (
        <AddSongFab onClick={handleAddSongFabClick} playerHeight={playerHeight} />
      )}

      {/* 플로팅 Spotify 플레이어*/}
      <FloatingSpotifyPlayer
        ref={playerRef}
        song={currentTrack}
        onClose={handlePlayerClose}
        onHeightChange={handlePlayerHeightChange}
        onSelectTrack={handleSelectSearchTrack}
        onPlaybackStateChange={handlePlaybackStateChange}
      />
    </div>
  );
}
