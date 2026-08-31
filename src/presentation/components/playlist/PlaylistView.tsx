import { ArrowRight, ChevronRight, Search, User } from 'lucide-react';
import { useState, useEffect, useCallback, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { useBackHandler } from '../../hooks/useBackHandler';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { FloatingSpotifyPlayer, type PlayableTrack } from './FloatingSpotifyPlayer';
import { AddSongFab } from './AddSongFab';
import { AddSongView } from './AddSongView';
import { RecentSongsView } from './RecentSongsView';
import { SearchResultsView, type TrackResult } from './SearchResultsView';
import { TrackPostsView } from './TrackPostsView';
import { PostDetailView } from './PostDetailView';
import { MyActivityView } from './MyActivityView';
import { BookmarkedSongsView } from './BookmarkedSongsView';
import { MySongsView } from './MySongsView';
import { RecentSongCard } from './RecentSongCard';
import { ChartSongRow } from './ChartSongRow';
import { EmptyChartState } from './EmptyChartState';
import { type Song, type ChartPeriod, CHART_PERIOD_OPTIONS } from './playlistTypes';
import { ChartView } from './ChartView';
import { type ChartTrack } from '../../../domain/entities/PopularityChart.js';
import { getOrCreateAnonymousUserId } from '../../../lib/supabase.js';
import { useRecentSongs, useRecordTrackPlay, usePopularityChart } from '../../hooks/useRecentSongs.js';

const RECENT_SONGS_LIMIT = 7;
const CHART_LIMIT = 10;
// 같은 곡을 연타/실수로 여러 번 눌러도 인기차트 재생수가 과하게 부풀지 않도록, 트랙별로 이 시간 안엔 재생기록을 다시 안 보냄
const TRACK_PLAY_THROTTLE_MS = 10 * 1000;

type PlaylistScreen = 'main' | 'recent' | 'addSong' | 'search' | 'trackPosts' | 'postDetail' | 'chart' | 'myActivity' | 'bookmarked' | 'mySongs';

export function PlaylistView({ onBack }: { onBack: () => void }) {
  const isApp = isNativeApp();
  const platform = getPlatform();
  const [searchQuery, setSearchQuery] = useState('');
  // 최근추가된곡은 /api/v1/playlist/songs에서 받아온 뒤 로컬 state로 옮겨 관리 —
  // 곡 등록 API가 아직 없어서, 등록 직후엔 서버 재조회 없이 로컬로만 맨 앞에 얹기 때문
  const { data: fetchedSongs, refetch: refetchRecentSongs } = useRecentSongs();
  const [songs, setSongs] = useState<Song[]>([]);
  useEffect(() => {
    if (fetchedSongs) setSongs(fetchedSongs);
  }, [fetchedSongs]);
  // 홈 미리보기와 인기차트 전체보기 화면이 같은 기간 필터를 공유
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('popular');
  const { data: chartData, isLoading: isChartLoading } = usePopularityChart(chartPeriod);
  const chartTracks = chartData?.tracks ?? [];
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const recordTrackPlay = useRecordTrackPlay();
  // trackId별 마지막 재생기록 전송 시각 — 리렌더와 무관하게 유지돼야 해서 state가 아니라 ref
  const lastPlayRecordedAtRef = useRef<Map<string, number>>(new Map());
  // 재생 버튼이 어디서 눌리든(최근추가곡/인기차트/검색/게시글 등) 이 함수 하나로 모여서
  // 플레이어를 띄우는 것과 별개로 재생수 기록 API를 함께 호출함 — 단, 같은 트랙은 스로틀 시간 안엔 다시 안 보냄
  const handlePlay = useCallback((track: PlayableTrack) => {
    setCurrentTrack(track);

    const now = Date.now();
    const lastRecordedAt = lastPlayRecordedAtRef.current.get(track.trackId) ?? 0;
    if (now - lastRecordedAt < TRACK_PLAY_THROTTLE_MS) return;

    lastPlayRecordedAtRef.current.set(track.trackId, now);
    recordTrackPlay.mutate(track.trackId);
  }, [recordTrackPlay.mutate]);
  // FloatingSpotifyPlayer가 실측해서 올려주는 카드 높이(px) — 0이면 플레이어 닫힘.
  // 하단 화면들의 여백(--playlist-bottom-space)과 AddSongFab 위치 계산에 함께 쓰임.
  const [playerHeight, setPlayerHeight] = useState(0);
  const handlePlayerHeightChange = useCallback((height: number) => setPlayerHeight(height), []);
  // 검색 결과의 곡 카드 또는 주간/월간 인기차트 리스트를 눌러 선택된 곡 — 값이 있으면 TrackPostsView(곡 단위 게시글 목록)로 이동
  const [selectedTrackForPosts, setSelectedTrackForPosts] = useState<TrackResult | null>(null);
  // 게시글 목록에서 눌러 선택된 게시글 id — 값이 있으면 PostDetailView가 GET /api/v1/playlist/songs/{id}로 상세 조회
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // 홈의 최근 추가된 곡 카드를 눌렀을 때, 전체보기 화면에서 바로 그 카드 위치로 스크롤하기 위한 대상
  const [recentScrollTarget, setRecentScrollTarget] = useState<string | null>(null);
  // 에리카 플레이리스트가 홈, 그 위에 화면들이 스택처럼 쌓임 (예: 홈 → 최근추가된곡 → 곡추천하기)
  const [screenStack, setScreenStack] = useState<PlaylistScreen[]>(['main']);
  const screen = screenStack[screenStack.length - 1];

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

  // 뒤로가기는 스택을 한 단계씩 pop — 어느 화면에서 들어왔는지와 무관하게 항상 바로 이전 화면으로 돌아감
  const popScreen = useCallback(() => {
    setScreenStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
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

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const prevScreen = prevScreenRef.current;
    if (prevScreen === screen) return;

    scrollPositionsRef.current[prevScreen] = container.scrollTop;
    container.scrollTop = scrollPositionsRef.current[screen] ?? 0;
    prevScreenRef.current = screen;
  }, [screen]);

  const handleSearchSubmit = useCallback(() => {
    if (!searchQuery.trim()) return;
    pushScreen('search');
  }, [searchQuery, pushScreen]);

  const handleSelectSearchTrack = useCallback((track: TrackResult) => {
    setSelectedTrackForPosts(track);
    pushScreen('trackPosts');
  }, [pushScreen]);

  // 인기차트 리스트 클릭 — ChartTrack을 TrackResult 형태로 변환해 동일한 TrackPostsView로 이동
  const handleSelectChartSong = useCallback((track: ChartTrack) => {
    setSelectedTrackForPosts({
      trackId: track.trackId,
      title: track.title,
      artist: track.artist,
      albumArtUrl: track.albumArtUrl,
    });
    pushScreen('trackPosts');
  }, [pushScreen]);

  // 게시글 목록(TrackPostsView/SearchResultsView) 항목 클릭 — 어느 목록에서 들어왔든 항상 같은 PostDetailView로 이동
  const handleSelectPost = useCallback((post: Song) => {
    setSelectedPostId(post.id ?? null);
    pushScreen('postDetail');
  }, [pushScreen]);

  // "전체보기" 화살표 클릭 — 특정 곡으로 스크롤할 필요 없이 맨 위부터 보여줌
  const handleShowAllRecent = useCallback(() => {
    setRecentScrollTarget(null);
    pushScreen('recent');
  }, [pushScreen]);

  // 홈의 최근 추가된 곡 카드 클릭 — 전체보기 화면으로 이동하면서 누른 카드 위치로 바로 스크롤
  const handleSelectRecentSong = useCallback((song: Song) => {
    setRecentScrollTarget(song.trackId);
    pushScreen('recent');
  }, [pushScreen]);

  const visibleSongs = songs.slice(0, RECENT_SONGS_LIMIT);
  const visibleChart = chartTracks.slice(0, CHART_LIMIT);

  const bottomSpace = playerHeight > 0 ? playerHeight + 4 : 4;

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-[1001] overflow-y-auto overflow-x-hidden mx-auto w-full max-w-app px-4 py-4"
      style={{
        backgroundColor: '#F8F9FA',
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(14, 74, 132, 0.05), transparent 30%), radial-gradient(circle at 90% 80%, rgba(14, 74, 132, 0.03), transparent 30%)',
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
            onPlay={handlePlay}
            onShowAddSong={() => pushScreen('addSong')}
            scrollToTrackId={recentScrollTarget}
            currentTrackId={currentTrack?.trackId}
          />
        ) : screen === 'addSong' ? (
          <AddSongView
            onBack={popScreen}
            playerHeight={playerHeight}
            onPlay={handlePlay}
            currentTrackId={currentTrack?.trackId}
          />
        ) : screen === 'search' ? (
          <SearchResultsView
            query={searchQuery}
            onBack={popScreen}
            onSelectTrack={handleSelectSearchTrack}
            onSelectPost={handleSelectPost}
            onPlay={handlePlay}
            currentTrackId={currentTrack?.trackId}
          />
        ) : screen === 'trackPosts' && selectedTrackForPosts ? (
          <TrackPostsView
            track={selectedTrackForPosts}
            onBack={popScreen}
            onSelectPost={handleSelectPost}
            onPlay={() => handlePlay(selectedTrackForPosts)}
            isPlaying={selectedTrackForPosts.trackId === currentTrack?.trackId}
          />
        ) : screen === 'postDetail' && selectedPostId ? (
          <PostDetailView postId={selectedPostId} onBack={popScreen} />
        ) : screen === 'chart' ? (
          <ChartView
            chart={chartTracks}
            isLoading={isChartLoading}
            chartPeriod={chartPeriod}
            onChangePeriod={setChartPeriod}
            onBack={popScreen}
            onShowAddSong={() => pushScreen('addSong')}
            onPlay={handlePlay}
            onShowPosts={handleSelectChartSong}
          />
        ) : screen === 'myActivity' ? (
          <MyActivityView
            onBack={popScreen}
            onShowBookmarked={() => pushScreen('bookmarked')}
            onShowMySongs={() => pushScreen('mySongs')}
          />
        ) : screen === 'bookmarked' ? (
          <BookmarkedSongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushScreen('addSong')}
            currentTrackId={currentTrack?.trackId}
          />
        ) : screen === 'mySongs' ? (
          <MySongsView
            onBack={popScreen}
            onPlay={handlePlay}
            onShowAddSong={() => pushScreen('addSong')}
            currentTrackId={currentTrack?.trackId}
          />
        ) : (
          <PlaylistMainContent
            onBack={onBack}
            visibleSongs={visibleSongs}
            visibleChart={visibleChart}
            isChartLoading={isChartLoading}
            chartPeriod={chartPeriod}
            onChangeChartPeriod={setChartPeriod}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSubmitSearch={handleSearchSubmit}
            onShowAllRecent={handleShowAllRecent}
            onSelectRecentSong={handleSelectRecentSong}
            onShowAllChart={() => pushScreen('chart')}
            onShowAddSong={() => pushScreen('addSong')}
            onPlay={handlePlay}
            onShowPosts={handleSelectChartSong}
            onShowMyActivity={() => pushScreen('myActivity')}
          />
        )}
      </div>

      {/* 곡 추가 FAB: 곡추천하기 화면에서는 숨김. 플레이어 열림/닫힘에 따라 위치가 애니메이션으로 이동함 */}
      {screen !== 'addSong' && (
        <AddSongFab onClick={() => pushScreen('addSong')} playerHeight={playerHeight} />
      )}

      {/* 플로팅 Spotify 플레이어*/}
      <FloatingSpotifyPlayer
        song={currentTrack}
        onClose={() => setCurrentTrack(null)}
        onHeightChange={handlePlayerHeightChange}
      />
    </div>
  );
}

interface PlaylistMainContentProps {
  onBack: () => void;
  visibleSongs: Song[];
  visibleChart: ChartTrack[];
  isChartLoading: boolean;
  chartPeriod: ChartPeriod;
  onChangeChartPeriod: (period: ChartPeriod) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmitSearch: () => void;
  onShowAllRecent: () => void;
  onSelectRecentSong: (song: Song) => void;
  onShowAllChart: () => void;
  onShowAddSong: () => void;
  onPlay: (track: ChartTrack) => void;
  onShowPosts: (track: ChartTrack) => void;
  onShowMyActivity: () => void;
}

function PlaylistMainContent({
  onBack,
  visibleSongs,
  visibleChart,
  isChartLoading,
  chartPeriod,
  onChangeChartPeriod,
  searchQuery,
  setSearchQuery,
  onSubmitSearch,
  onShowAllRecent,
  onSelectRecentSong,
  onShowAllChart,
  onShowAddSong,
  onPlay,
  onShowPosts,
  onShowMyActivity,
}: PlaylistMainContentProps) {
  return (
    <div className="pb-[calc(var(--playlist-bottom-space,204px)+env(safe-area-inset-bottom))] transition-[padding-bottom] duration-300 ease-out">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들에게 곡을 추천해주세요!"
        onBack={onBack}
        rightAction={
          <button
            onClick={onShowMyActivity}
            aria-label="내 활동 보기"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-text-main transition-shadow active:scale-95"
          >
            <User size={16} strokeWidth={2} />
          </button>
        }
      />

      {/* 검색바: Enter 또는 오른쪽 화살표를 누르면 검색 결과 화면으로 이동 */}
      <div className="mb-4 flex items-center gap-2 px-3.5 h-11 bg-white border border-slate-200 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.03)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(14,74,132,0.1)] transition-all">
        <Search size={16} className="text-text-hint flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmitSearch();
          }}
          placeholder="곡 제목이나 아티스트로 검색해보세요"
          className="flex-1 min-w-0 bg-transparent text-sm text-text-main placeholder-text-hint outline-none"
        />
        <button
          onClick={onSubmitSearch}
          disabled={!searchQuery.trim()}
          aria-label="검색"
          className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-text-sub disabled:text-text-hint hover:bg-slate-100 transition-colors active:scale-90"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      {/* 최근 추가된 곡 섹션 */}
      <section className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-lg font-bold text-text-main">🎵 최근 추가된 곡</h3>
          <button
            onClick={onShowAllRecent}
            className="flex items-center justify-center text-text-sub hover:text-text-main transition-colors active:scale-95"
            aria-label="최근 추가된 곡 전체보기"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3 pb-2">
            {visibleSongs.map((song) => (
              <RecentSongCard
                key={song.id ?? song.trackId}
                song={song}
                onClick={() => onSelectRecentSong(song)}
              />
            ))}
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 인기차트 섹션 */}
      <section>
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-lg font-bold text-text-main">🔥 인기차트</h3>
          <button
            onClick={onShowAllChart}
            className="flex items-center justify-center text-text-sub hover:text-text-main transition-colors active:scale-95"
            aria-label="인기차트 전체보기"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 기간 필터 칩 */}
        <div className="flex gap-2 mb-2">
          {CHART_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onChangeChartPeriod(option.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all duration-200 active:scale-[0.96] ${
                chartPeriod === option.key
                  ? 'bg-[#2B3B52] text-white border-transparent shadow-[0_4px_10px_rgba(43,59,82,0.35)]'
                  : 'bg-white text-[#2B3B52] border-[#2B3B52]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 차트 리스트 */}
        <div className="bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200 font-semibold text-xs text-gray-600 bg-slate-50">
            <span className="w-7 text-center">순위</span>
            <div className="flex-1">곡정보</div>
            <div className="w-6 text-center">듣기</div>
          </div>

          {/* 리스트 */}
          {isChartLoading ? (
            <div className="py-10 text-center text-sm text-text-hint">불러오는 중...</div>
          ) : visibleChart.length === 0 ? (
            <EmptyChartState
              onShowAddSong={onShowAddSong}
              periodLabel={CHART_PERIOD_OPTIONS.find((option) => option.key === chartPeriod)?.label ?? ''}
            />
          ) : (
            visibleChart.map((track) => (
              <ChartSongRow
                key={track.trackId}
                track={track}
                onPlay={onPlay}
                onShowPosts={onShowPosts}
              />
            ))
          )}
        </div>

        {/* 더보기 — 인기차트 전체보기로 이동 */}
        {visibleChart.length > 0 && (
          <div className="flex justify-center mt-3">
            <button
              onClick={onShowAllChart}
              className="px-7 py-2.5 rounded-full text-sm font-bold text-text-sub bg-white border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:bg-slate-50 hover:text-text-main transition-colors active:scale-95"
            >
              더보기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
