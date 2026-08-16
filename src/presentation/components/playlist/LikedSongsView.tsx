import { type Song } from './playlistTypes';
import { SongListScreen } from './SongListScreen';

const DUMMY_LIKED_SONGS: Song[] = [
  {
    trackId: '5eBM5qATb1IfJvNzGuS2GX',
    title: 'Busy Boy',
    artist: '주혜린',
    albumArtUrl: '',
    userProfile: { name: '민지', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liked1' },
    comment: '완전 내 최애곡',
    genres: ['K-pop'],
    heartCount: 312,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '3Q3wWJxr6sBt8afP9hJj4J',
    title: 'LOVE SONG',
    artist: '유다빈밴드',
    albumArtUrl: '',
    userProfile: { name: '태희', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liked2' },
    comment: '노래방 필수곡',
    genres: ['K-pop'],
    heartCount: 289,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '171mGT1HdxM2HdqZrWNY31',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: '',
    userProfile: { name: '성은', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liked3' },
    comment: '가사가 진짜 좋아요',
    genres: ['K-pop'],
    heartCount: 241,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4uh6rj3FryYQXMz9zLqDKL',
    title: 'Fly away',
    artist: '권진아',
    albumArtUrl: '',
    userProfile: { name: '기범', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liked4' },
    comment: '드라이브할 때 딱',
    genres: ['K-pop'],
    heartCount: 198,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '63yKhliWjZOJ39UQhXcBhO',
    title: '왜,왜,왜',
    artist: 'SUMIN',
    albumArtUrl: '',
    userProfile: { name: '소연', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liked5' },
    comment: '중독성 甲',
    genres: ['K-pop'],
    heartCount: 176,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '6W4iF5kAqqwKiVwAk3TcN1',
    title: '하루에 한번씩',
    artist: '거니',
    albumArtUrl: '',
    userProfile: { name: '준호', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liked6' },
    comment: '매일 듣는 중',
    genres: ['K-pop'],
    heartCount: 154,
    previewUrl: '',
    createdAt: new Date(),
  },
  {
    trackId: '4Qqd4mzQzVGpvPrzq3Dtn8',
    title: '초록',
    artist: '윤마치',
    albumArtUrl: '',
    userProfile: { name: '지은', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liked7' },
    comment: '분위기 최고',
    genres: ['K-pop'],
    heartCount: 132,
    previewUrl: '',
    createdAt: new Date(),
  },
];

interface LikedSongsViewProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onRequireLogin: () => void;
}

export function LikedSongsView({ onBack, onPlay, onRequireLogin }: LikedSongsViewProps) {
  return (
    <SongListScreen
      title="좋아요 누른곡"
      emoji="🙆🩵"
      subtitle=""
      songs={DUMMY_LIKED_SONGS}
      onBack={onBack}
      onPlay={onPlay}
      onRequireLogin={onRequireLogin}
    />
  );
}
