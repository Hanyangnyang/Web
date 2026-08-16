export interface Song {
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

export const GENRES = [
  { key: 'all', label: '전체', emoji: '', colorIndex: -1 },
  { key: 'rb', label: 'R&B', emoji: '🎤', colorIndex: 0 },
  { key: 'kpop', label: 'K-pop', emoji: '🎸', colorIndex: 1 },
  { key: 'indie', label: '인디', emoji: '🎹', colorIndex: 2 },
  { key: 'rock', label: '락', emoji: '🎸', colorIndex: 3 },
  { key: 'ballad', label: '발라드', emoji: '🎻', colorIndex: 4 },
  { key: 'hiphop', label: '힙합', emoji: '🎤', colorIndex: 5 },
];
