import { ChevronRight, Heart } from 'lucide-react';
import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { useBackHandler } from '../../hooks/useBackHandler';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { FloatingSpotifyPlayer } from './FloatingSpotifyPlayer';
import { AddSongFab } from './AddSongFab';
import { AddSongView } from './AddSongView';
import { LikedSongsView } from './LikedSongsView';
import { RecentSongsView } from './RecentSongsView';
import { RecentSongCard } from './RecentSongCard';
import { ChartSongRow } from './ChartSongRow';
import { EmptyGenreState } from './EmptyGenreState';
import { GenreFilterChips } from './GenreFilterChips';
import { SongPostsModal } from './SongPostsModal';
import { type Song, filterSongsByGenre } from './playlistTypes';
import { DUMMY_SONGS, DUMMY_CHART } from './playlistDummyData';

const RECENT_SONGS_LIMIT = 7;
const CHART_LIMIT = 10;

type PlaylistScreen = 'main' | 'recent' | 'addSong' | 'liked';

export function PlaylistView({ onBack }: { onBack: () => void }) {
  const isApp = isNativeApp();
  const platform = getPlatform();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [songs, setSongs] = useState<Song[]>(DUMMY_SONGS);
  const [chart, setChart] = useState<Song[]>(DUMMY_CHART);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  // 주간 인기차트에서 "게시글 보러가기" 화살표를 눌러 선택된 곡 — 값이 있으면 SongPostsModal이 뜸
  const [selectedChartSong, setSelectedChartSong] = useState<Song | null>(null);
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
          />
        ) : (
          <PlaylistMainContent
            onBack={onBack}
            visibleSongs={visibleSongs}
            visibleChart={visibleChart}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            onShowAllRecent={() => pushScreen('recent')}
            onShowLiked={() => pushScreen('liked')}
            onShowAddSong={() => pushScreen('addSong')}
            onPlay={setCurrentTrack}
            onShowPosts={setSelectedChartSong}
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

      {/* 주간 인기차트 → 추천 게시글 캐러셀 모달 */}
      {selectedChartSong && (
        <SongPostsModal song={selectedChartSong} onClose={() => setSelectedChartSong(null)} />
      )}
    </div>
  );
}

interface PlaylistMainContentProps {
  onBack: () => void;
  visibleSongs: Song[];
  visibleChart: Song[];
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  onShowAllRecent: () => void;
  onShowLiked: () => void;
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
  onShowAllRecent,
  onShowLiked,
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
          <button
            onClick={onShowLiked}
            className="flex items-center gap-1 px-3 h-8 bg-red-400/10 text-red-500 border border-red-400 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow active:scale-95"
          >
            <Heart size={14} fill="currentColor" strokeWidth={2} />
            <span className="text-[12px] text-text-main font-bold">좋아요 한 곡</span>
          </button>
        }
      />

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
                onPlay={onPlay}
              />
            ))}
            <div className="w-1 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* 주간 인기차트 섹션 */}
      <section>
        <div className="flex items-center mb-1">
          <h3 className="text-lg font-bold text-text-main">주간 인기차트</h3>
        </div>

        {/* 장르 필터 칩 */}
        <GenreFilterChips
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          variant="main"
          className="pb-2 -mx-4"
        />

        {/* 차트 리스트 */}
        <div className="bg-white rounded-card border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200 font-semibold text-xs text-gray-600 bg-slate-50">
            <span className="w-7 text-center">순위</span>
            <div className="flex-1">곡정보</div>
            <div className="w-6 text-center">듣기</div>
            <div className="w-6 text-center flex-shrink-0">게시글</div>
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
