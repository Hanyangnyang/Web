import { Plus, Heart, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';
import { getGenreColor, getGenreActiveColor } from './playlistTheme';
import { FloatingSpotifyPlayer } from './FloatingSpotifyPlayer';
import { SocialLoginModal } from './SocialLoginModal';

interface Song {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  userProfile: {
    name: string;
    avatarUrl: string;
  };
  comment: string;
  genres: string[];
  heartCount: number;
  previewUrl: string;
  createdAt: Date;
}

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
    trackId: '3',
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
    trackId: '4',
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
];

const GENRES = [
  { key: 'all', label: '전체', emoji: '', colorIndex: -1 },
  { key: 'rb', label: 'R&B', emoji: '🎤', colorIndex: 0 },
  { key: 'kpop', label: 'K-pop', emoji: '🎸', colorIndex: 1 },
  { key: 'indie', label: '인디', emoji: '🎹', colorIndex: 2 },
  { key: 'rock', label: '락', emoji: '🎸', colorIndex: 3 },
  { key: 'ballad', label: '발라드', emoji: '🎻', colorIndex: 4 },
  { key: 'hiphop', label: '힙합', emoji: '🎤', colorIndex: 5 },
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
    trackId: '105',
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
    trackId: '106',
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

  return (
    <div className="pb-24">
      <MiscSubViewHeader
        title="에리카 플레이리스트"
        emoji="🕺"
        subtitle="에리카인들에게 본인의 곡을 추천해주세요!"
        onBack={onBack}
        rightAction={
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full transition-colors active:scale-95"
          >
            ❤️ 좋아요 누른곡
          </button>
        }
      />

      {/* 최근 추가된 곡 섹션 */}
      <section className="mb-4">
        <div className="flex items-center mb-3">
          <h3 className="text-lg font-bold text-text-main">최근 추가된 곡</h3>
        </div>

        <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex gap-3 pb-2">
            {songs.map((song) => {
              const [heartClicked, setHeartClicked] = useState(false);
              const [displayHeartCount, setDisplayHeartCount] = useState(song.heartCount);

              const handleHeartClick = () => {
                setShowLoginModal(true);
              };

              const handlePlayClick = () => {
                setCurrentTrack(song);
              };

              return (
                <div
                  key={song.trackId}
                  className="flex-shrink-0 w-56 aspect-[4/5] bg-white rounded-lg overflow-hidden shadow-md flex flex-col relative"
                >
                  {/* 앨범커버 + 오버레이 */}
                  <div className="relative flex-1">
                    <img
                      src={song.albumArtUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />

                    {/* 중앙 재생 버튼 */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <button onClick={handlePlayClick} className="flex items-center justify-center text-black hover:scale-110 transition-transform active:scale-95">
                        <Play size={40} fill="none" stroke="currentColor" strokeWidth={2} />
                      </button>
                    </div>

                    {/* 우측 상단 하트 버튼 + 개수 */}
                    <div className="absolute top-2 right-2 flex flex-col items-center gap-0 z-10">
                      <button
                        onClick={handleHeartClick}
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                      >
                        <Heart
                          size={18}
                          className="text-red-500 stroke-[2]"
                          fill={heartClicked ? "currentColor" : "none"}
                        />
                      </button>
                      <div className="text-[10px] font-extrabold text-white drop-shadow-lg">
                        {displayHeartCount}
                      </div>
                    </div>

                    {/* 그라데이션 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black pointer-events-none" />
                    {/* 곡 정보 오버레이 */}
                    <div className="absolute bottom-[52px] inset-x-0 px-3 py-3 text-white">
                      <div className="text-sm font-bold truncate">{song.title}</div>
                      <div className="text-sm opacity-90 truncate">{song.artist}</div>
                    </div>
                  </div>

                  {/* 사용자 정보 섹션 */}
                  <div className="absolute bottom-0 inset-x-0 px-3 py-3 bg-gradient-to-b from-black/50 to-black rounded-b-lg z-10">
                    <div className="flex items-center gap-2">
                      <img
                        src={song.userProfile.avatarUrl}
                        alt={song.userProfile.name}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-white/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white leading-snug line-clamp-1">
                          "{song.comment}"
                        </div>
                        <div className="text-[10px] text-white truncate ml-1 opacity-80 ">
                          {song.userProfile.name}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
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
            <div className="flex flex-col items-center justify-center w-8 flex-shrink-0">좋아요</div>
          </div>

          {/* 리스트 */}
          {chart.map((song, index) => {
            const [heartClicked, setHeartClicked] = useState(false);
            const [displayHeartCount, setDisplayHeartCount] = useState(song.heartCount);

            const handleHeartClick = () => {
              setShowLoginModal(true);
            };

            return (
              <div
                key={song.trackId}
                className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {/* 순위 */}
                <span className="font-bold text-sm text-gray-900 w-7 text-center flex-shrink-0">
                  {index + 1}
                </span>

                {/* Spotify embed player */}
                <div className="flex-1">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${song.trackId}?utm_source=generator`}
                    width="100%"
                    height="88"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded"
                  />
                </div>

                {/* 좋아요 */}
                <div className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={handleHeartClick}
                    className="flex items-center justify-center w-6 text-red-500 hover:scale-110 transition-transform active:scale-95"
                  >
                    <Heart
                      size={18}
                      className="stroke-[2]"
                      fill={heartClicked ? "currentColor" : "none"}
                    />
                  </button>
                  <span className="text-[9px] font-semibold text-black">{displayHeartCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 플로팅 Spotify 플레이어 */}
      <FloatingSpotifyPlayer
        song={currentTrack}
        onClose={() => setCurrentTrack(null)}
      />

      {/* FAB 버튼 */}
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-hyu-blue text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow active:scale-95">
        <Plus size={24} />
      </button>

      {/* 소셜 로그인 모달 */}
      <SocialLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
