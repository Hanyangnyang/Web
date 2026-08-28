export interface Song {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  userProfile: {
    avatarUrl: string;
  };
  comment: string;
  genres: string[];
  heartCount: number;
  previewUrl: string;
  createdAt: Date;
}

export const GENRES = [
  { key: 'all', label: '전체', emoji: '', light: '', active: '' },
  { key: 'kpop', label: 'K-POP', emoji: '🕺', light: 'bg-[rgba(254,215,170,0.6)]', active: 'bg-[rgba(230,140,60,1)]' },
  { key: 'rock', label: '락', emoji: '🎸', light: 'bg-[rgba(254,202,202,0.6)]', active: 'bg-[rgba(239,68,68,1)]' },
  { key: 'band', label: '밴드', emoji: '🥁', light: 'bg-[rgba(165,243,252,0.6)]', active: 'bg-[rgba(6,182,212,1)]' },
  { key: 'rb', label: 'R&B', emoji: '🎹', light: 'bg-[rgba(251,207,232,0.6)]', active: 'bg-[rgba(219,39,119,1)]' },
  { key: 'hiphop', label: '힙합', emoji: '🎤', light: 'bg-[rgba(233,213,255,0.6)]', active: 'bg-[rgba(147,51,234,1)]' },
  { key: 'indie', label: '인디', emoji: '☁️', light: 'bg-[rgba(191,219,254,0.6)]', active: 'bg-[rgba(59,130,246,1)]' },
  { key: 'ballad', label: '발라드', emoji: '🎻', light: 'bg-[rgba(187,247,208,0.6)]', active: 'bg-[rgba(34,197,94,1)]' },
  { key: 'pop', label: 'POP', emoji: '🗽', light: 'bg-[rgba(153,246,228,0.6)]', active: 'bg-[rgba(20,184,166,1)]' },
  { key: 'jpop', label: 'J-POP', emoji: '🎏', light: 'bg-[rgba(254,240,138,0.6)]', active: 'bg-[rgba(202,138,4,1)]' },
  { key: 'other', label: '기타', emoji: '🎧', light: 'bg-[rgba(229,231,235,0.6)]', active: 'bg-[rgba(107,114,128,1)]' },
];

// selectedGenre는 GENRES의 key('indie' 등), song.genres에는 label('인디' 등)이 들어있어서 변환해서 비교
export function filterSongsByGenre(songs: Song[], selectedGenre: string): Song[] {
  if (selectedGenre === 'all') return songs;
  const label = GENRES.find((genre) => genre.key === selectedGenre)?.label;
  return songs.filter((song) => song.genres.includes(label ?? ''));
}
