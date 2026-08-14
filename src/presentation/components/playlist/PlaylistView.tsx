import { Music, Plus } from 'lucide-react';
import { useState } from 'react';
import { MiscSubViewHeader } from '../misc/MiscSubViewHeader';

interface Song {
  id: string;
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

const DUMMY_SONGS: Song[] = [
  {
    id: '1',
    title: '아주, 천천히',
    artist: '비비',
    albumArtUrl: 'https://via.placeholder.com/200',
    userProfile: { name: '이줄', avatarUrl: 'https://via.placeholder.com/50' },
    comment: '4명이 이 음악을 재생했어요.',
    genres: ['R&B', '발라드'],
    heartCount: 1,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: '밤편지',
    artist: '아이유',
    albumArtUrl: 'https://via.placeholder.com/200',
    userProfile: { name: '민지', avatarUrl: 'https://via.placeholder.com/50' },
    comment: '감성 만렙',
    genres: ['발라드'],
    heartCount: 5,
    previewUrl: '',
    createdAt: new Date(),
  },
];

const GENRES = ['전체', 'R&B', 'K-pop', '인디', '락', '발라드', '힙합'];

const DUMMY_CHART: Song[] = [
  {
    id: '101',
    title: 'Busy Boy',
    artist: '우르릉',
    albumArtUrl: 'https://via.placeholder.com/80',
    userProfile: { name: '익명', avatarUrl: 'https://via.placeholder.com/40' },
    comment: '',
    genres: ['인디'],
    heartCount: 100,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    id: '102',
    title: '만나다',
    artist: 'FT아일',
    albumArtUrl: 'https://via.placeholder.com/80',
    userProfile: { name: '익명', avatarUrl: 'https://via.placeholder.com/40' },
    comment: '',
    genres: ['K-pop'],
    heartCount: 87,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    id: '103',
    title: '지기지기',
    artist: '쏜딕스',
    albumArtUrl: 'https://via.placeholder.com/80',
    userProfile: { name: '익명', avatarUrl: 'https://via.placeholder.com/40' },
    comment: '',
    genres: ['인디'],
    heartCount: 90,
    previewUrl: '',
    createdAt: new Date(),
  },
];

export function PlaylistView({ onBack }: { onBack: () => void }) {
  const [selectedGenre, setSelectedGenre] = useState('전체');

  return (
    <div className="pb-24">
      <MiscSubViewHeader title="에리카 플레이리스트" onBack={onBack} />

      {/* 최근 추천된 곡 섹션 */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-lg font-bold text-text-main">최근 추천된 곡 &gt;</h3>
        </div>

        <div className="overflow-x-auto px-4 -mx-4 scrollbar-hide">
          <div className="flex gap-3 pb-2">
            {DUMMY_SONGS.map((song) => (
              <div
                key={song.id}
                className="flex-shrink-0 w-56 bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-4 text-white"
              >
                <div className="flex gap-3 mb-3">
                  <img
                    src={song.albumArtUrl}
                    alt={song.title}
                    className="w-12 h-12 rounded-lg object-cover border border-white/30"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold truncate">{song.title}</div>
                    <div className="text-xs opacity-90 truncate">{song.artist}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs mb-3">
                  <img
                    src={song.userProfile.avatarUrl}
                    alt={song.userProfile.name}
                    className="w-6 h-6 rounded-full border border-white/30"
                  />
                  <span className="opacity-90">{song.userProfile.name}</span>
                </div>

                <div className="text-xs opacity-80 mb-3">{song.comment}</div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-1">
                    {song.genres.map((genre) => (
                      <span key={genre} className="bg-white/20 px-2 py-1 rounded text-xs">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>❤️</span>
                    <span>{song.heartCount}</span>
                  </div>
                </div>

                <button className="w-full mt-3 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Music size={14} />
                  Spotify
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 주간 인기차트 섹션 */}
      <section>
        <div className="px-4 mb-3">
          <h3 className="text-lg font-bold text-text-main mb-3">주간 인기차트 &gt;</h3>

          {/* 장르 필터 칩 */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all ${
                  selectedGenre === genre
                    ? 'bg-hyu-blue text-white'
                    : 'bg-surface text-text-main hover:bg-slate-200'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* 차트 리스트 */}
        <div className="space-y-2 px-4">
          {DUMMY_CHART.map((song, index) => (
            <div key={song.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-hyu-blue text-white flex items-center justify-center font-bold text-xs">
                {index + 1}
              </div>
              <img src={song.albumArtUrl} alt={song.title} className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text-main truncate text-sm">{song.title}</div>
                <div className="text-xs text-text-sub">{song.artist}</div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span>❤️</span>
                <span className="font-semibold text-text-main">{song.heartCount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAB 버튼 */}
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-hyu-blue text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow active:scale-95">
        <Plus size={24} />
      </button>
    </div>
  );
}
