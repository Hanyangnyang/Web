import { useState, useEffect, useCallback, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useBackHandler } from '../../hooks/useBackHandler';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { FloatingSpotifyPlayer, type PlayableTrack, type FloatingSpotifyPlayerHandle } from './shared/FloatingSpotifyPlayer';
import { AddSongFab, FAB_HEIGHT_PX, FAB_CLOSED_BOTTOM_PX, PLAYER_GAP_PX } from './shared/AddSongFab';
import { RecommendSongView } from './recommendSong/RecommendSongView';
import { RecentSongsView } from './recentSongs/RecentSongsView';
import { SearchResultsView } from './searchResults/SearchResultsView';
import { TrackPostCollectionView } from './trackPostCollection/TrackPostCollectionView';
import { PostView } from './post/PostView';
import { MyPageView } from './myPage/MyPageView';
import { BookmarkedSongsView } from './bookmarkedSongs/BookmarkedSongsView';
import { MySongsView } from './mySongs/MySongsView';
import { PlaylistHomeView } from './home/PlaylistHomeView';
import { type Song, type ChartPeriod, type TrackSummary } from './playlistTypes';
import { ChartView } from './chart/ChartView';
import { type ChartTrack } from '../../../domain/entities/PopularityChart.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { useRecentSongs } from '../../hooks/playlist/useRecentSongs.js';
import { useRecordTrackPlay } from '../../hooks/playlist/useRecordTrackPlay.js';
import { usePopularityChart } from '../../hooks/playlist/usePopularityChart.js';
import { useRecentSongsTapAreaVariant, type RecentSongsPlaySurface } from '../../hooks/playlist/usePlaylistExperiment';

const RECENT_SONGS_LIMIT = 7;
const SUSTAINED_PLAY_THRESHOLD_MS = 3000; // 재생 시작 후 이만큼 지속돼야 "진짜 재생"으로 집계(오탭 걸러내기 — docs/playlist-recent-songs-ab-test.md 참고)
const CHART_PREVIEW_LIMIT = 10;
const TRACK_PLAY_THROTTLE_MS = 10 * 1000; // 같은 곡을 연타/실수로 여러 번 눌러도 인기차트 재생수가 과하게 부풀지 않도록, 트랙별로 이 시간 안엔 재생기록을 다시 안 보냄

type PlaylistScreen = 'main' | 'recent' | 'addSong' | 'search' | 'trackPosts' | 'postDetail' | 'chart' | 'myActivity' | 'bookmarked' | 'mySongs';

interface PlaylistViewProps {
  onBack: () => void;
  deepLinkTrackId?: string | null;
  onDeepLinkTrackIdHandled?: () => void;
}

export function PlaylistView({ onBack, deepLinkTrackId, onDeepLinkTrackIdHandled }: PlaylistViewProps) {
  const isApp = isNativeApp();
  const platform = getPlatform();
  const posthog = usePostHog();
  // "최근 추가된 곡" 재생 인터랙션 A/B 테스트 배정 — docs/playlist-recent-songs-ab-test.md 참고
  const recentSongsVariant = useRecentSongsTapAreaVariant();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: fetchedSongs, isLoading: isRecentSongsLoading, refetch: refetchRecentSongs } = useRecentSongs();
  const [songs, setSongs] = useState<Song[]>([]);
  useEffect(() => {
    if (fetchedSongs) setSongs(fetchedSongs);
  }, [fetchedSongs]);
  // 홈 미리보기와 인기차트 전체보기 화면이 같은 기간 필터를 공유
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('popular');
  const { data: chartData, isLoading: isChartLoading } = usePopularityChart(chartPeriod);
  const chartTracks = chartData?.tracks ?? [];
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  // FloatingSpotifyPlayer(Spotify iframe)가 실제로 보고하는 재생/일시정지 상태 — currentTrack은
  // "어떤 곡이 로드돼 있는지"만 알려주고 재생 중인지는 몰라서 별도로 들고 있어야 함
  const [isPaused, setIsPaused] = useState(true);
  const playerRef = useRef<FloatingSpotifyPlayerHandle>(null);
  // 카드들에 "지금 이 트랙이 재생 중"이라고 넘겨줄 값 — 로드만 돼 있고 일시정지 상태면 null로 취급해서,
  // 그 카드의 재생 버튼이 계속 재생 아이콘(▶)으로 보이고 다시 누르면 이어재생되게 함
  const playingTrackId = isPaused ? null : (currentTrack?.trackId ?? null);
  const recordTrackPlay = useRecordTrackPlay();
  // trackId별 마지막 재생기록 전송 시각 — 리렌더와 무관하게 유지돼야 해서 state가 아니라 ref
  const lastPlayRecordedAtRef = useRef<Map<string, number>>(new Map());
  // 재생이 3초 이상 지속됐는지 검사할 때 최신 재생 상태를 읽기 위한 ref — setTimeout 콜백은 handlePlay가
  // 만들어진 시점의 state를 그대로 들고 있어서(클로저), 그 사이 다른 곡을 누르거나 멈춘 최신 상태를 못 봄
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  const currentTrackRef = useRef(currentTrack);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  const sustainedPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 재생 버튼이 어디서 눌리든(최근추가곡/인기차트/검색/게시글 등) 이 함수 하나로 모임 — 같은 곡이 이미
  // 로드돼 있으면 재생/일시정지만 토글하고, 다른 곡이면 새로 로드해서 재생 + 재생수 기록(트랙별 스로틀 적용).
  // surface를 넘기면 "최근 추가된 곡" A/B 테스트 지표(재생 시작/3초 이상 지속)를 표면별로 캡처함
  // (docs/playlist-recent-songs-ab-test.md 참고) — 다른 화면(검색/인기차트/게시글 등)에서 부를 땐 surface를 안 넘겨서 캡처 안 함
  const handlePlay = useCallback((track: PlayableTrack, surface?: RecentSongsPlaySurface) => {
    if (currentTrack?.trackId === track.trackId) {
      if (isPaused) {
        playerRef.current?.resume();
        setIsPaused(false);
      } else {
        playerRef.current?.pause();
        setIsPaused(true);
      }
      return;
    }

    if (surface) {
      posthog?.capture('playlist_recent_song_play', { surface, variant: recentSongsVariant, track_id: track.trackId });
      if (sustainedPlayTimeoutRef.current) clearTimeout(sustainedPlayTimeoutRef.current);
      sustainedPlayTimeoutRef.current = setTimeout(() => {
        if (currentTrackRef.current?.trackId === track.trackId && !isPausedRef.current) {
          posthog?.capture('playlist_recent_song_play_sustained', { surface, variant: recentSongsVariant, track_id: track.trackId });
        }
      }, SUSTAINED_PLAY_THRESHOLD_MS);
    }

    setCurrentTrack(track);
    setIsPaused(false); // 새 곡은 바로 재생을 시도하므로 낙관적으로 반영 — 실제 상태는 playback_update가 뒤이어 보정함

    const now = Date.now();
    const lastRecordedAt = lastPlayRecordedAtRef.current.get(track.trackId) ?? 0;
    if (now - lastRecordedAt < TRACK_PLAY_THROTTLE_MS) return;

    lastPlayRecordedAtRef.current.set(track.trackId, now);
    recordTrackPlay.mutate(track.trackId);
  }, [currentTrack, isPaused, recordTrackPlay.mutate, posthog, recentSongsVariant]);
  // FloatingSpotifyPlayer가 실측해서 올려주는 카드 높이(px) — 0이면 플레이어 닫힘.
  const [playerHeight, setPlayerHeight] = useState(0);
  const handlePlayerHeightChange = useCallback((height: number) => setPlayerHeight(height), []);
  // 검색 결과의 곡 카드 또는 주간/월간 인기차트 리스트를 눌러 선택된 곡 — 값이 있으면 TrackPostCollectionView(곡 단위 게시글 모음)로 이동
  const [selectedTrackForPosts, setSelectedTrackForPosts] = useState<TrackSummary | null>(null);
  // 게시글 목록에서 눌러 선택된 게시글 id — 값이 있으면 PostView가 GET /api/v1/playlist/songs/{id}로 상세 조회
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // 홈의 최근 추가된 곡 카드를 눌렀을 때, 전체보기 화면에서 바로 그 카드 위치로 스크롤하기 위한 대상
  const [recentScrollTarget, setRecentScrollTarget] = useState<string | null>(null);
  // 최근추가된곡/저장한곡/추천한곡 화면의 그리드·리스트 뷰 모드 — 이 화면들은 게시글 상세로 갔다가
  // 뒤로가기로 돌아오면 통째로 리마운트돼서, PlaylistView(이 화면들을 드나들어도 유지됨)에 보관해뒀다가
  // 마지막으로 보던 모드를 그대로 복원함
  const [recentViewMode, setRecentViewMode] = useState<'grid' | 'list'>('list');
  const [bookmarkedViewMode, setBookmarkedViewMode] = useState<'grid' | 'list'>('list');
  const [mySongsViewMode, setMySongsViewMode] = useState<'grid' | 'list'>('list');
  // 에리카 플레이리스트가 홈, 그 위에 화면들이 스택처럼 쌓임 (예: 홈 → 최근추가된곡 → 곡추천하기)
  const [screenStack, setScreenStack] = useState<PlaylistScreen[]>(['main']);
  const screen = screenStack[screenStack.length - 1];
  // "어떤 곡을 추천해볼까요?" 클릭 시 검색 결과 화면(빈 검색어라 보여줄 게 없음) 대신
  // 홈으로 돌아가면서 검색바에 바로 포커스를 줌 — PlaylistHomeView가 마운트될 때 한 번 소비
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);

  // PlaylistView 자체는 최근추가된곡 화면을 드나들어도 마운트가 유지돼서, react-query의
  // staleTime이 지나 있어도 "새로 마운트되는 시점" 트리거가 없어 자동으로 재조회되지 않았음.
  // 그래서 이 화면에 들어오는 시점 자체를 트리거로 삼아 직접 refetch — staleTime이 안 지났으면
  // react-query가 알아서 네트워크 요청 없이 캐시를 그대로 반환함
  useEffect(() => {
    if (screen === 'recent') refetchRecentSongs();
  }, [screen, refetchRecentSongs]);

  const pushScreen = useCallback((next: PlaylistScreen) => {
    setScreenStack((prev) => [...prev, next]);
  }, []);

  // 게시글 모음의 "이 곡 추천하러 가기" 버튼처럼 특정 곡이 미리 채워진 채로 곡추천하기 화면에 들어갈 때 씀.
  // prefill 없이 부르는 모든 진입점(FAB 등)에서는 매번 null로 초기화해서, 이전에 넣어뒀던 값이 새는 걸 막음
  const [addSongPrefillTrack, setAddSongPrefillTrack] = useState<TrackSummary | null>(null);
  const pushAddSong = useCallback((prefill?: TrackSummary) => {
    setAddSongPrefillTrack(prefill ?? null);
    pushScreen('addSong');
  }, [pushScreen]);

  // 뒤로가기는 스택을 한 단계씩 pop — 어느 화면에서 들어왔는지와 무관하게 항상 바로 이전 화면으로 돌아감
  const popScreen = useCallback(() => {
    setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  // 곡추천하기 등록 성공 — 어느 화면에서 곡추천하기로 들어왔든, 자기 곡이 잘 올라갔는지 바로
  // 볼 수 있게 최근추가된곡으로 보냄. addSong 프레임을 그대로 recent로 바꿔치기해서(push가 아님)
  // 뒤로가기를 누르면 addSong 이전 화면으로 돌아가지, addSong 폼으로 돌아가지 않음
  const handleAddSongSuccess = useCallback(() => {
    setRecentScrollTarget(null);
    setScreenStack((prev) => [...prev.slice(0, -1), 'recent']);
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

  // 화면(홈/최근추가된곡/곡추천하기)마다 스크롤 위치를 독립적으로 기억했다가 복원
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef<Partial<Record<PlaylistScreen, number>>>({});
  const prevScreenRef = useRef<PlaylistScreen>(screen);
  // 홈/최근추가된곡 화면 체류시간 측정용 — 이 화면에 들어온 시각. A/B 테스트 지표(체류시간)라 이 두 화면만 잰다
  const screenEnteredAtRef = useRef<number>(Date.now());
  // 언마운트 시(뒤로가기로 플레이리스트 탭 자체를 나갈 때) 최신 화면/뷰모드를 읽기 위한 ref —
  // 언마운트 클린업은 컴포넌트가 처음 마운트될 때의 클로저를 그대로 쓰기 때문에 state를 직접 참조하면 항상 초기값만 보게 됨
  const currentScreenRef = useRef(screen);
  useEffect(() => { currentScreenRef.current = screen; }, [screen]);
  const recentViewModeRef = useRef(recentViewMode);
  useEffect(() => { recentViewModeRef.current = recentViewMode; }, [recentViewMode]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const prevScreen = prevScreenRef.current;
    if (prevScreen === screen) return;

    if (prevScreen === 'main' || prevScreen === 'recent') {
      posthog?.capture('playlist_screen_dwell', {
        screen: prevScreen,
        duration_ms: Date.now() - screenEnteredAtRef.current,
        variant: recentSongsVariant,
        ...(prevScreen === 'recent' ? { view_mode: recentViewMode } : {}),
      });
    }
    screenEnteredAtRef.current = Date.now();

    scrollPositionsRef.current[prevScreen] = container.scrollTop;
    // 홈에서 특정 카드를 눌러 최근추가된곡 화면의 그 카드 위치로 스크롤하려는 목표가 있으면,
    // 여기서 스크롤 위치를 되돌리지 않고 SongListScreen의 자체 스크롤(scrollIntoView)에 맡김 —
    // 안 그러면 이 효과가 곧바로 scrollTop을 0으로 되돌려서 그 스크롤을 무효화시킴
    if (!(screen === 'recent' && recentScrollTarget)) {
      container.scrollTop = scrollPositionsRef.current[screen] ?? 0;
    }
    prevScreenRef.current = screen;
  }, [screen, recentScrollTarget, posthog, recentSongsVariant, recentViewMode]);

  // 뒤로가기로 플레이리스트 탭 자체를 나가는 경우(화면 전환 없이 바로 언마운트) — 위 효과는 화면이
  // "바뀔 때"만 캡처하므로, 나가는 순간의 체류시간은 언마운트 클린업에서 별도로 잡아야 함
  useEffect(() => {
    return () => {
      const exitScreen = currentScreenRef.current;
      if (exitScreen === 'main' || exitScreen === 'recent') {
        posthog?.capture('playlist_screen_dwell', {
          screen: exitScreen,
          duration_ms: Date.now() - screenEnteredAtRef.current,
          variant: recentSongsVariant,
          exit: true,
          ...(exitScreen === 'recent' ? { view_mode: recentViewModeRef.current } : {}),
        });
      }
    };
  }, [posthog, recentSongsVariant]);

  const handleSearchSubmit = useCallback(() => {
    if (!searchQuery.trim()) return;
    pushScreen('search');
  }, [searchQuery, pushScreen]);

  const handleSelectSearchTrack = useCallback((track: TrackSummary) => {
    setSelectedTrackForPosts(track);
    pushScreen('trackPosts');
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
    setSelectedTrackForPosts({
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      albumArtUrl: track.albumArtUrl,
    });
    pushScreen('trackPosts');
  }, [pushScreen]);

  // 게시글 목록(TrackPostCollectionView/SearchResultsView) 항목 클릭 — 어느 목록에서 들어왔든 항상 같은 PostView로 이동
  const handleSelectPost = useCallback((post: Song) => {
    setSelectedPostId(post.id ?? null);
    pushScreen('postDetail');
  }, [pushScreen]);

  // 홈의 하단 "더보기"는 미리보기 마지막 곡 위치까지 부드럽게 내려간 뒤 이어서 목록을 보게 한다.
  // 헤더 화살표·빈 상태 등 다른 진입점은 기존처럼 목록 맨 위부터 보여준다.
  // A안/B안 사이 이견 없이 병합하는 개선이라 A/B 테스트 대상은 아니지만, "홈 → 최근추가된곡 진입" CTR 지표는 여기서 같이 캡처함
  const handleShowAllRecent = useCallback((scrollToLastPreview = false) => {
    posthog?.capture('playlist_recent_show_all_clicked', { variant: recentSongsVariant, trigger: scrollToLastPreview ? 'more_button' : 'header_arrow' });
    const previewSongs = songs.slice(0, RECENT_SONGS_LIMIT);
    const lastPreviewTrackId = previewSongs[previewSongs.length - 1]?.trackId ?? null;
    setRecentScrollTarget(scrollToLastPreview ? lastPreviewTrackId : null);
    pushScreen('recent');
  }, [pushScreen, songs, posthog, recentSongsVariant]);

  // 홈의 최근 추가된 곡 카드 클릭 — 전체보기 화면으로 이동하면서 누른 카드 위치로 바로 스크롤
  const handleSelectRecentSong = useCallback((song: Song) => {
    posthog?.capture('playlist_recent_preview_navigate', { variant: recentSongsVariant, track_id: song.trackId });
    setRecentScrollTarget(song.trackId);
    pushScreen('recent');
  }, [pushScreen, posthog, recentSongsVariant]);

  const visibleSongs = songs.slice(0, RECENT_SONGS_LIMIT);
  const visibleChart = chartTracks.slice(0, CHART_PREVIEW_LIMIT);

  // AddSongFab은 곡추천하기 화면(screen === 'addSong')만 빼고 항상 떠 있어서, 그 화면이 아니면
  // 여백 계산에 FAB의 실제 크기·간격(AddSongFab.tsx가 export하는 값과 항상 일치)까지 더해야
  // 목록 마지막 항목이 FAB에 가려지지 않는다
  const FAB_GAP_ABOVE_CONTENT = 12;
  const isFabVisible = screen !== 'addSong';
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
      } as CSSProperties}
    >
      <div key={screen} style={{ animation: 'fadeIn 0.25s ease-out' }}>
        {screen === 'recent' ? (
          <RecentSongsView
            songs={songs}
            onBack={popScreen}
            onPlay={(song) => handlePlay(song, 'recent_full_list')}
            onShowAddSong={() => pushAddSong()}
            onShowSearch={() => {
              setAutoFocusSearch(true);
              setScreenStack(['main']);
            }}
            onSelectTrack={handleSelectSearchTrack}
            scrollToTrackId={recentScrollTarget}
            currentTrackId={playingTrackId}
            viewMode={recentViewMode}
            onViewModeChange={setRecentViewMode}
            playButtonVariant={recentSongsVariant}
          />
        ) : screen === 'addSong' ? (
          <RecommendSongView
            onBack={popScreen}
            onSubmitSuccess={handleAddSongSuccess}
            playerHeight={playerHeight}
            onPlay={handlePlay}
            currentTrackId={playingTrackId}
            prefillTrack={addSongPrefillTrack}
          />
        ) : screen === 'search' ? (
          <SearchResultsView
            query={searchQuery}
            onBack={popScreen}
            onSelectTrack={handleSelectSearchTrack}
            onSelectPost={handleSelectPost}
            onPlay={handlePlay}
            currentTrackId={playingTrackId}
            onShowAddSong={() => pushAddSong()}
          />
        ) : screen === 'trackPosts' && selectedTrackForPosts ? (
          <TrackPostCollectionView
            track={selectedTrackForPosts}
            onBack={popScreen}
            onSelectPost={handleSelectPost}
            onPlay={() => handlePlay(selectedTrackForPosts)}
            isPlaying={selectedTrackForPosts.trackId === playingTrackId}
            onRecommendTrack={pushAddSong}
          />
        ) : screen === 'postDetail' && selectedPostId ? (
          <PostView
            postId={selectedPostId}
            onBack={popScreen}
            onPlay={handlePlay}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
          />
        ) : screen === 'chart' ? (
          <ChartView
            chart={chartTracks}
            isLoading={isChartLoading}
            chartPeriod={chartPeriod}
            onChangePeriod={setChartPeriod}
            onBack={popScreen}
            onShowRecent={handleShowAllRecent}
            onPlay={handlePlay}
            onShowPosts={handleSelectChartSong}
            currentTrackId={playingTrackId}
          />
        ) : screen === 'myActivity' ? (
          <MyPageView
            onBack={popScreen}
            onShowBookmarked={() => pushScreen('bookmarked')}
            onShowMySongs={() => pushScreen('mySongs')}
          />
        ) : screen === 'bookmarked' ? (
          <BookmarkedSongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushAddSong()}
            onShowRecent={handleShowAllRecent}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
            viewMode={bookmarkedViewMode}
            onViewModeChange={setBookmarkedViewMode}
          />
        ) : screen === 'mySongs' ? (
          <MySongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushAddSong()}
            onSelectTrack={handleSelectSearchTrack}
            currentTrackId={playingTrackId}
            viewMode={mySongsViewMode}
            onViewModeChange={setMySongsViewMode}
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
            onShowAllChart={() => pushScreen('chart')}
            onShowPosts={handleSelectChartSong}
            onShowMyActivity={() => pushScreen('myActivity')}
            onShowAddSong={() => pushAddSong()}
            autoFocusSearch={autoFocusSearch}
            onAutoFocusSearchConsumed={() => setAutoFocusSearch(false)}
          />
        )}
      </div>

      {/* 곡 추가 FAB: 곡추천하기 화면에서는 숨김. 플레이어 열림/닫힘에 따라 위치가 애니메이션으로 이동함 */}
      {screen !== 'addSong' && (
        <AddSongFab onClick={() => pushAddSong()} playerHeight={playerHeight} />
      )}

      {/* 플로팅 Spotify 플레이어*/}
      <FloatingSpotifyPlayer
        ref={playerRef}
        song={currentTrack}
        onClose={() => {
          setCurrentTrack(null);
          setIsPaused(true);
        }}
        onHeightChange={handlePlayerHeightChange}
        onSelectTrack={handleSelectSearchTrack}
        onPlaybackStateChange={setIsPaused}
      />
    </div>
  );
}
