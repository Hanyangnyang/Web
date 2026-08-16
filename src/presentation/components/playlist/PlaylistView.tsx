import { ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { getGenreColor, getGenreActiveColor } from './playlistTheme';
import { FloatingSpotifyPlayer } from './FloatingSpotifyPlayer';
import { SocialLoginModal } from './SocialLoginModal';
import { AddSongFab } from './AddSongFab';
import { RecentSongsView } from './RecentSongsView';
import { RecentSongCard } from './RecentSongCard';
import { ChartSongRow } from './ChartSongRow';
import { type Song, GENRES } from './playlistTypes';

const RECENT_SONGS_LIMIT = 7;
const CHART_LIMIT = 10;

const USER_NAMES = ['이줄', '민지', '수진', '준호', '태희', '성은', '다영', '호진', '지은', '명준', '민준', '혜원', '기범', '소연', '주현'];
const USER_COMMENTS = [
  '이 노래 진짜 좋아! 🎶',
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
  '이 아티스트 완전 사랑해',
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
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 245,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '171mGT1HdxM2HdqZrWNY31',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 198,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '3c0anSTjsn20lztbBmZt03',
    title: '미장원',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 187,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '0kt2S0FV9DEGIOg247sT8b',
    title: '미친건가',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 176,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4uh6rj3FryYQXMz9zLqDKL',
    title: 'Fly away',
    artist: '권진아',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 165,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '171mGT1HdxM2HdqZrWNY31',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 265,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '3c0anSTjsn20lztbBmZt03',
    title: '미장원',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 254,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '0kt2S0FV9DEGIOg247sT8b',
    title: '미친건가',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 243,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4uh6rj3FryYQXMz9zLqDKL',
    title: 'Fly away',
    artist: '권진아',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 232,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '6W4iF5kAqqwKiVwAk3TcN1',
    title: '하루에 한번씩',
    artist: '거니',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 221,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '63yKhliWjZOJ39UQhXcBhO',
    title: '왜,왜,왜',
    artist: 'SUMIN',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 210,
    previewUrl: '',
    createdAt: new Date(),
  },
];

const DUMMY_CHART: Song[] = [
  {
    trackId: '3Q3wWJxr6sBt8afP9hJj4J',
    title: 'LOVE SONG',
    artist: '유다빈밴드',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 298,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4Qqd4mzQzVGpvPrzq3Dtn8',
    title: '초록',
    artist: '윤마치',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 287,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '5eBM5qATb1IfJvNzGuS2GX',
    title: 'Busy Boy',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 276,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '171mGT1HdxM2HdqZrWNY31',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 265,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '3c0anSTjsn20lztbBmZt03',
    title: '미장원',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 254,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '0kt2S0FV9DEGIOg247sT8b',
    title: '미친건가',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 243,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4uh6rj3FryYQXMz9zLqDKL',
    title: 'Fly away',
    artist: '권진아',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 232,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '6W4iF5kAqqwKiVwAk3TcN1',
    title: '하루에 한번씩',
    artist: '거니',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 221,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '63yKhliWjZOJ39UQhXcBhO',
    title: '왜,왜,왜',
    artist: 'SUMIN',
    albumArtUrl: '',
    userProfile: { name: getRandomElement(USER_NAMES), avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${getRandomUserId()}` },
    comment: getRandomElement(USER_COMMENTS),
    genres: ['K-pop'],
    heartCount: 210,
    previewUrl: '',
    createdAt: new Date(),
  },
];

export function PlaylistView({ onBack }: { onBack: () => void }) {
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [songs, setSongs] = useState<Song[]>(DUMMY_SONGS);
  const [chart, setChart] = useState<Song[]>(DUMMY_CHART);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);

  const visibleSongs = songs.slice(0, RECENT_SONGS_LIMIT);
  const visibleChart = chart.slice(0, CHART_LIMIT);

  return (
    <>
      {showAllRecent ? (
        <RecentSongsView
          songs={songs}
          onBack={() => setShowAllRecent(false)}
          onPlay={setCurrentTrack}
          onRequireLogin={() => setShowLoginModal(true)}
        />
      ) : (
        <PlaylistMainContent
          onBack={onBack}
          visibleSongs={visibleSongs}
          visibleChart={visibleChart}
          selectedGenre={selectedGenre}
          setSelectedGenre={setSelectedGenre}
          onShowAllRecent={() => setShowAllRecent(true)}
          onShowLoginModal={() => setShowLoginModal(true)}
          onPlay={setCurrentTrack}
        />
      )}

      {/* 곡 추가 FAB + 플로팅 Spotify 플레이어 (화면 전환과 무관하게 항상 같은 위치에서 렌더링되어야 상태가 유지됨) */}
      <AddSongFab isPlayerOpen={!!currentTrack} />
      <FloatingSpotifyPlayer
        song={currentTrack}
        onClose={() => setCurrentTrack(null)}
        onRequireLogin={() => setShowLoginModal(true)}
      />

      {/* 소셜 로그인 모달 */}
      <SocialLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}

interface PlaylistMainContentProps {
  onBack: () => void;
  visibleSongs: Song[];
  visibleChart: Song[];
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  onShowAllRecent: () => void;
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
  onShowLoginModal,
  onPlay,
}: PlaylistMainContentProps) {
  return (
    <div className="pb-24">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카생들에게 곡을 추천해주세요!"
        onBack={onBack}
        rightAction={
          <button
            onClick={onShowLoginModal}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full transition-colors active:scale-95"
          >
            ❤️ 좋아요 누른곡
          </button>
        }
      />

      {/* 최근 추가된 곡 섹션 */}
      <section className="mb-4">
        <div className="flex items-center gap-1 mb-3">
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
        <div className="flex items-center mb-3">
          <h3 className="text-lg font-bold text-text-main">주간 인기차트</h3>
        </div>

        {/* 장르 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 ml-[-1rem] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {GENRES.map((genre) => (
            <button
              key={genre.key}
              onClick={() => setSelectedGenre(genre.key)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all duration-200 active:scale-[0.96] ${
                selectedGenre === genre.key && genre.key !== 'all'
                  ? `${getGenreActiveColor(genre.colorIndex)} text-white border-transparent shadow-[0_2px_6px_rgba(14,74,132,0.25)]`
                  : genre.key === 'all' && selectedGenre === 'all'
                    ? 'bg-blue-200 text-blue-900 border-blue-300 shadow-[0_2px_6px_rgba(191,219,254,0.3)]'
                    : genre.key === 'all'
                      ? 'bg-slate-200 text-slate-800 border-slate-400'
                      : `${getGenreColor(genre.colorIndex)} text-gray-800 border-transparent`
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
          {visibleChart.map((song, index) => (
            <ChartSongRow
              key={song.trackId}
              song={song}
              rank={index + 1}
              onPlay={onPlay}
              onRequireLogin={onShowLoginModal}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
