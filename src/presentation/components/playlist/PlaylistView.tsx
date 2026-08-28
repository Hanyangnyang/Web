import { ArrowRight, ChevronRight, Search, User } from 'lucide-react';
import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { useBackHandler } from '../../hooks/useBackHandler';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { FloatingSpotifyPlayer, type PlayableTrack } from './FloatingSpotifyPlayer';
import { AddSongFab } from './AddSongFab';
import { AddSongView } from './AddSongView';
import { LikedSongsView } from './LikedSongsView';
import { RecentSongsView } from './RecentSongsView';
import { SearchResultsView, type TrackResult } from './SearchResultsView';
import { TrackPostsView } from './TrackPostsView';
import { PostDetailView } from './PostDetailView';
import { RecentSongCard } from './RecentSongCard';
import { ChartSongRow } from './ChartSongRow';
import { EmptyGenreState } from './EmptyGenreState';
import { type Song, filterSongsByGenre } from './playlistTypes';
import { DUMMY_SONGS, DUMMY_CHART } from './playlistDummyData';

const RECENT_SONGS_LIMIT = 7;
const CHART_LIMIT = 10;

type PlaylistScreen = 'main' | 'recent' | 'addSong' | 'liked' | 'search' | 'trackPosts' | 'postDetail';

export function PlaylistView({ onBack }: { onBack: () => void }) {
  const isApp = isNativeApp();
  const platform = getPlatform();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>(DUMMY_SONGS);
  const [chart, setChart] = useState<Song[]>(DUMMY_CHART);
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  // 검색 결과의 곡 카드 또는 주간/월간 인기차트 리스트를 눌러 선택된 곡 — 값이 있으면 TrackPostsView(곡 단위 게시글 목록)로 이동
  const [selectedTrackForPosts, setSelectedTrackForPosts] = useState<TrackResult | null>(null);
  // 홈의 최근 추가된 곡 카드를 눌렀을 때, 전체보기 화면에서 바로 그 카드 위치로 스크롤하기 위한 대상
  const [recentScrollTarget, setRecentScrollTarget] = useState<string | null>(null);
  // 에리카 플레이리스트가 홈, 그 위에 화면들이 스택처럼 쌓임 (예: 홈 → 좋아요한곡 → 곡추천하기)
  const [screenStack, setScreenStack] = useState<PlaylistScreen[]>(['main']);
  const screen = screenStack[screenStack.length - 1];

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

  // 화면(홈/최근추가된곡/좋아요한곡/곡추천하기)마다 스크롤 위치를 독립적으로 기억했다가 복원
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

  // Supabase 테이블 붙기 전까지 임시로 최근 추가된 곡 맨 앞에 로컬로만 추가 (새로고침하면 초기화됨)
  const handleAddSong = useCallback((song: Song) => {
    setSongs((prev) => [song, ...prev]);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (!searchQuery.trim()) return;
    pushScreen('search');
  }, [searchQuery, pushScreen]);

  const handleSelectSearchTrack = useCallback((track: TrackResult) => {
    setSelectedTrackForPosts(track);
    pushScreen('trackPosts');
  }, [pushScreen]);

  // 주간/월간 인기차트 리스트 클릭 — Song을 TrackResult 형태로 변환해 동일한 TrackPostsView로 이동
  const handleSelectChartSong = useCallback((song: Song) => {
    setSelectedTrackForPosts({
      trackId: song.trackId,
      title: song.title,
      artist: song.artist,
      albumArtUrl: song.albumArtUrl,
    });
    pushScreen('trackPosts');
  }, [pushScreen]);

  // 게시글 목록(TrackPostsView/SearchResultsView) 항목 클릭 — 어느 목록에서 들어왔든 항상 같은 PostDetailView로 이동
  const handleSelectPost = useCallback(() => {
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

  // 최근 추가된 곡은 장르 필터와 무관하게 항상 그대로 노출, 주간 인기차트만 필터링됨
  const filteredChart = filterSongsByGenre(chart, selectedGenre);

  const visibleSongs = songs.slice(0, RECENT_SONGS_LIMIT);
  const visibleChart = filteredChart.slice(0, CHART_LIMIT);

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-[1001] overflow-y-auto overflow-x-hidden mx-auto w-full max-w-app px-4 py-6"
      style={{
        backgroundColor: '#F8F9FA',
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(14, 74, 132, 0.05), transparent 30%), radial-gradient(circle at 90% 80%, rgba(14, 74, 132, 0.03), transparent 30%)',
        animation: 'fadeIn 0.25s ease-out',
        ...(isApp ? {
          paddingTop: `calc(1.5rem + ${platform === 'ios' ? 'env(safe-area-inset-top)' : 'env(safe-area-inset-top, 28px)'})`,
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        } : {}),
      }}
    >
      <div key={screen} style={{ animation: 'fadeIn 0.25s ease-out' }}>
        {screen === 'recent' ? (
          <RecentSongsView
            songs={songs}
            onBack={popScreen}
            onPlay={setCurrentTrack}
            onShowAddSong={() => pushScreen('addSong')}
            scrollToTrackId={recentScrollTarget}
            currentTrackId={currentTrack?.trackId}
          />
        ) : screen === 'addSong' ? (
          <AddSongView
            onBack={popScreen}
            onSongAdded={handleAddSong}
          />
        ) : screen === 'liked' ? (
          <LikedSongsView
            onBack={popScreen}
            onPlay={setCurrentTrack}
            onShowAddSong={() => pushScreen('addSong')}
            currentTrackId={currentTrack?.trackId}
          />
        ) : screen === 'search' ? (
          <SearchResultsView
            query={searchQuery}
            onBack={popScreen}
            onSelectTrack={handleSelectSearchTrack}
            onSelectPost={handleSelectPost}
          />
        ) : screen === 'trackPosts' && selectedTrackForPosts ? (
          <TrackPostsView
            track={selectedTrackForPosts}
            onBack={popScreen}
            onSelectPost={handleSelectPost}
            onPlay={() => setCurrentTrack(selectedTrackForPosts)}
            isPlaying={selectedTrackForPosts.trackId === currentTrack?.trackId}
          />
        ) : screen === 'postDetail' ? (
          <PostDetailView onBack={popScreen} />
        ) : (
          <PlaylistMainContent
            onBack={onBack}
            visibleSongs={visibleSongs}
            visibleChart={visibleChart}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSubmitSearch={handleSearchSubmit}
            onShowAllRecent={handleShowAllRecent}
            onSelectRecentSong={handleSelectRecentSong}
            onShowAddSong={() => pushScreen('addSong')}
            onPlay={setCurrentTrack}
            onShowPosts={handleSelectChartSong}
          />
        )}
      </div>

      {/* 곡 추가 FAB: 곡추천하기 화면에서는 숨김. 플레이어 열림/닫힘에 따라 위치가 애니메이션으로 이동함 */}
      {screen !== 'addSong' && (
        <AddSongFab onClick={() => pushScreen('addSong')} playerOpen={!!currentTrack} />
      )}

      {/* 플로팅 Spotify 플레이어*/}
      <FloatingSpotifyPlayer
        song={currentTrack}
        onClose={() => setCurrentTrack(null)}
      />
    </div>
  );
}

interface PlaylistMainContentProps {
  onBack: () => void;
  visibleSongs: Song[];
  visibleChart: Song[];
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSubmitSearch: () => void;
  onShowAllRecent: () => void;
  onSelectRecentSong: (song: Song) => void;
  onShowAddSong: () => void;
  onPlay: (song: Song) => void;
  onShowPosts: (song: Song) => void;
}

function PlaylistMainContent({
  onBack,
  visibleSongs,
  visibleChart,
  selectedGenre,
  setSelectedGenre,
  searchQuery,
  setSearchQuery,
  onSubmitSearch,
  onShowAllRecent,
  onSelectRecentSong,
  onShowAddSong,
  onPlay,
  onShowPosts,
}: PlaylistMainContentProps) {
  return (
    <div className="pb-[calc(204px+env(safe-area-inset-bottom))]">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들에게 곡을 추천해주세요!"
        onBack={onBack}
        rightAction={
          // 내 추천곡/좋아요한 곡 보기: 동작은 추후 구현
          <button
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
          <h3 className="text-lg font-bold text-text-main">최근 추가된 곡</h3>
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
                key={song.trackId}
                song={song}
                onClick={() => onSelectRecentSong(song)}
              />
            ))}
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 주간 인기차트 섹션 */}
      <section>
        <div className="flex items-center mb-1">
          <h3 className="text-lg font-bold text-text-main">주간/월간 인기차트</h3>
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
          {visibleChart.length === 0 ? (
            <EmptyGenreState onShowAddSong={onShowAddSong} />
          ) : (
            visibleChart.map((song, index) => (
              <ChartSongRow
                key={song.trackId}
                song={song}
                rank={index + 1}
                onPlay={onPlay}
                onShowPosts={onShowPosts}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
