import { ChevronRight, Heart } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { useBackHandler } from '../../hooks/useBackHandler';
import { isNativeApp, getPlatform } from '../../../lib/platform.js';
import { FloatingSpotifyPlayer } from './FloatingSpotifyPlayer';
import { SocialLoginModal } from './SocialLoginModal';
import { AddSongFab } from './AddSongFab';
import { AddSongView } from './AddSongView';
import { LikedSongsView } from './LikedSongsView';
import { RecentSongsView } from './RecentSongsView';
import { RecentSongCard } from './RecentSongCard';
import { ChartSongRow } from './ChartSongRow';
import { EmptyGenreState } from './EmptyGenreState';
import { type Song, GENRES } from './playlistTypes';

const RECENT_SONGS_LIMIT = 7;
const CHART_LIMIT = 10;

const USER_NAMES = ['이줄', '민지', '수진', '준호', '태희', '성은', '다영', '호진', '지은', '명준', '민준', '혜원', '기범', '소연', '주현'];
const USER_COMMENTS = [
  '이 노래 진짜 좋아! 베이스가 미쳤어 내인생 이런 R&B는 처음이야 ㅠㅠ',
  '요즘 내 감성이야 ✨',
  '반복 재생 중...',
  '이렇게 좋은 곡이 있다니',
  '감성 만렙 💯',
  '매일 듣고 있어요',
  '이 가수 팬입니다! 🎤',
  '최고의 선택 👍',
  '중독성 있어요',
  '찐 명곡',
  '무한재생',
  '요즘 탈출곡',
  '혼자만 알고싶던 곡',
  '신곡 좋네요',
  '이 아티스트 완전 사랑해 진짜 너무너무너무너무너무너무너무 사랑해',
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomUserId(): number {
  return Math.floor(Math.random() * 30) + 1;
}

const DUMMY_SONGS: Song[] = [
  {
    trackId: '5eBM5qATb1IfJvNzGuS2GX',
    title: 'Busy Boy',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 245,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '3c0anSTjsn20lztbBmZt03',
    title: '미장원',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 187,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '0kt2S0FV9DEGIOg247sT8b',
    title: '미친건가',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 176,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4uh6rj3FryYQXMz9zLqDKL',
    title: 'Fly away',
    artist: '권진아',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273bee4779793a1d10af6e8bd4f',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['인디'],
    heartCount: 165,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '171mGT1HdxM2HdqZrWNY31',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b2734c02aacdf6281db79169e115',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['인디'],
    heartCount: 265,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '3aK5mtd4CKxLF6RpC1doh6',
    title: '마음으로',
    artist: '유다빈밴드',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273598f97c45eee469199fd0733',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['발라드'],
    heartCount: 243,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '6W4iF5kAqqwKiVwAk3TcN1',
    title: '하루에 한번씩',
    artist: '거니',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b27382e910c061e1c7555a02a266',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 221,
    previewUrl: '',
    createdAt: new Date(),
  },
];

const DUMMY_CHART: Song[] = [
  {
    trackId: '3Q3wWJxr6sBt8afP9hJj4J',
    title: 'LOVE SONG',
    artist: '유다빈밴드',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273fd07915694e0ffb3b961a7b5',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['인디'],
    heartCount: 298,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4Qqd4mzQzVGpvPrzq3Dtn8',
    title: '초록',
    artist: '윤마치',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273da16a8d501f1621068b0ea8b',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['인디'],
    heartCount: 287,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '5eBM5qATb1IfJvNzGuS2GX',
    title: 'Busy Boy',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 276,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '171mGT1HdxM2HdqZrWNY31',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b2734c02aacdf6281db79169e115',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['인디'],
    heartCount: 265,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '3c0anSTjsn20lztbBmZt03',
    title: '미장원',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 254,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '0kt2S0FV9DEGIOg247sT8b',
    title: '미친건가',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 243,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4uh6rj3FryYQXMz9zLqDKL',
    title: 'Fly away',
    artist: '권진아',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273bee4779793a1d10af6e8bd4f',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['인디'],
    heartCount: 232,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '6W4iF5kAqqwKiVwAk3TcN1',
    title: '하루에 한번씩',
    artist: '거니',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b27382e910c061e1c7555a02a266',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['R&B'],
    heartCount: 221,
    previewUrl: '',
    createdAt: new Date(),
  },
];

type PlaylistScreen = 'main' | 'recent' | 'addSong' | 'liked';

export function PlaylistView({ onBack }: { onBack: () => void }) {
  const isApp = isNativeApp();
  const platform = getPlatform();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [songs, setSongs] = useState<Song[]>(DUMMY_SONGS);
  const [chart, setChart] = useState<Song[]>(DUMMY_CHART);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [screen, setScreen] = useState<PlaylistScreen>('main');

  // 에리카 플레이리스트가 홈, 그 위에 화면들이 스택처럼 쌓임 — 뒤로가기는 스택을 한 단계씩 pop
  const handleBack = useCallback(() => {
    if (screen !== 'main') {
      setScreen('main');
    } else {
      onBack();
    }
  }, [screen, onBack]);
  useBackHandler(handleBack);

  // Supabase 테이블 붙기 전까지 임시로 최근 추가된 곡 맨 앞에 로컬로만 추가 (새로고침하면 초기화됨)
  const handleAddSong = useCallback((song: Song) => {
    setSongs((prev) => [song, ...prev]);
  }, []);

  // selectedGenre는 GENRES의 key('indie' 등), song.genres에는 label('인디' 등)이 들어있어서 변환해서 비교
  // 최근 추가된 곡은 장르 필터와 무관하게 항상 그대로 노출, 주간 인기차트만 필터링됨
  const selectedGenreLabel = GENRES.find((genre) => genre.key === selectedGenre)?.label;
  const filteredChart = selectedGenre === 'all'
    ? chart
    : chart.filter((song) => song.genres.includes(selectedGenreLabel ?? ''));

  const visibleSongs = songs.slice(0, RECENT_SONGS_LIMIT);
  const visibleChart = filteredChart.slice(0, CHART_LIMIT);

  return (
    // 기타탭(바텀네비바 포함) 위에 화면이 하나 더 쌓이는 형태 — 바텀네비바를 숨기는 대신
    // 이 오버레이가 z-index로 덮어버려서, 들어가고 나올 때 바텀네비바가 팝인/팝아웃하는 게 안 보임
    <div
      className="fixed inset-0 z-[1001] overflow-y-auto overflow-x-hidden mx-auto w-full max-w-app px-4 py-6"
      style={{
        // body(index.css)와 완전히 같은 배경 — 기타탭 뒤에 있는 것과 동일한 톤으로 보이게
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
      {/* key={screen}로 화면이 바뀔 때마다 새 엘리먼트로 취급돼 fadeIn이 매번 다시 재생됨 */}
      <div key={screen} style={{ animation: 'fadeIn 0.25s ease-out' }}>
        {screen === 'recent' ? (
          <RecentSongsView
            songs={songs}
            onBack={() => setScreen('main')}
            onPlay={setCurrentTrack}
            onRequireLogin={() => setShowLoginModal(true)}
            onShowAddSong={() => setScreen('addSong')}
          />
        ) : screen === 'addSong' ? (
          <AddSongView
            onBack={() => setScreen('main')}
            onRequireLogin={() => setShowLoginModal(true)}
            onSongAdded={handleAddSong}
          />
        ) : screen === 'liked' ? (
          <LikedSongsView
            onBack={() => setScreen('main')}
            onPlay={setCurrentTrack}
            onRequireLogin={() => setShowLoginModal(true)}
            onShowAddSong={() => setScreen('addSong')}
          />
        ) : (
          <PlaylistMainContent
            onBack={onBack}
            visibleSongs={visibleSongs}
            visibleChart={visibleChart}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            onShowAllRecent={() => setScreen('recent')}
            onShowLiked={() => setScreen('liked')}
            onShowAddSong={() => setScreen('addSong')}
            onShowLoginModal={() => setShowLoginModal(true)}
            onPlay={setCurrentTrack}
          />
        )}
      </div>

      {/* 곡 추가 FAB: 곡추천하기 화면에서는 숨김. 플레이어 열림/닫힘에 따라 위치가 애니메이션으로 이동함 */}
      {screen !== 'addSong' && (
        <AddSongFab onClick={() => setScreen('addSong')} playerOpen={!!currentTrack} />
      )}

      {/* 플로팅 Spotify 플레이어 (화면 전환과 무관하게 항상 같은 위치에서 렌더링되어야 상태가 유지됨) */}
      <FloatingSpotifyPlayer
        song={currentTrack}
        onClose={() => setCurrentTrack(null)}
        onRequireLogin={() => setShowLoginModal(true)}
      />

      {/* 소셜 로그인 모달 */}
      <SocialLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
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
  onShowLoginModal: () => void;
  onPlay: (song: Song) => void;
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
  onShowLoginModal,
  onPlay,
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
            className="flex items-center gap-1 px-2 h-8 bg-red-400/10 text-red-500 border border-red-400 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-shadow active:scale-95"
          >
            <Heart size={14} fill="currentColor" strokeWidth={2} />
            <span className="text-xs text-text-main font-bold">좋아요 한 곡</span>
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
                onRequireLogin={onShowLoginModal}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 주간 인기차트 섹션 */}
      <section>
        <div className="flex items-center mb-1">
          <h3 className="text-lg font-bold text-text-main">주간 인기차트</h3>
        </div>

        {/* 장르 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 ml-[-1rem] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {GENRES.map((genre) => (
            <button
              key={genre.key}
              onClick={() => setSelectedGenre(genre.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
                selectedGenre === genre.key && genre.key !== 'all'
                  ? `${genre.active} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
                  : genre.key === 'all' && selectedGenre === 'all'
                    ? 'bg-slate-700 text-white border-transparent shadow-[0_2px_6px_rgba(51,65,85,0.25)]'
                    : genre.key === 'all'
                      ? 'bg-slate-200 text-slate-800 border-slate-400'
                      : `${genre.light} text-gray-800 border-transparent`
              }`}
            >
              {genre.emoji && <span className="text-base">{genre.emoji}</span>}
              <span>{genre.label}</span>
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
            <div className="flex flex-col items-center justify-center w-8 flex-shrink-0">좋아요</div>
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
                onRequireLogin={onShowLoginModal}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
