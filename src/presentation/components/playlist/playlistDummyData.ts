// Supabase 테이블 붙기 전까지 화면을 채우는 더미데이터 모음. 실제 데이터 연동 시 이 파일째로 삭제.
import { type Song, GENRES } from './playlistTypes';

const ALL_GENRE_LABELS = GENRES.filter((genre) => genre.key !== 'all').map((genre) => genre.label);

// 곡추천하기에서 실제로 최대 3개까지 장르를 고를 수 있어서, 더미데이터도 주 장르 하나에
// 서로 다른 장르 2개를 무작위로 더 붙여 카드에서 여러 장르가 함께 보이도록 함
function withRandomGenres(primaryGenre: string): string[] {
  const otherGenres = ALL_GENRE_LABELS.filter((label) => label !== primaryGenre);
  const shuffled = [...otherGenres].sort(() => Math.random() - 0.5);
  return [primaryGenre, ...shuffled.slice(0, 2)];
}

const USER_COMMENTS = [
  '이 노래 진짜 좋아! 베이스 라인이 미쳤어, 이런 감성의 R&B는 진짜 오랜만이에요 ㅠㅠ',
  '요즘 제 감성을 이렇게까지 딱 대변해주는 곡은 진짜 오랜만이라 계속 듣고 있어요 ✨',
  '자기 전에 이 노래 틀어놓고 잠드는 게 요즘 하루 마무리 루틴이에요, 반복 재생 중...',
  '이렇게 좋은 곡이 이제야 눈에 들어오다니, 그동안 대체 왜 몰랐었나 싶은 곡이에요',
  '가사도 멜로디도 감성 만렙이라 듣자마자 바로 플레이리스트 맨 위에 올려놨어요 💯',
  '아침에 일어나서부터 밤에 잠들 때까지 하루종일 이 노래만 듣고 있는 것 같아요',
  '이 가수 목소리가 너무 좋아서 팬이 됐어요, 앞으로 나올 곡들도 다 챙겨 들을 예정이에요',
  '오늘 하루 진짜 힘들었는데 이 곡 듣고 기분이 확 풀렸어요, 최고의 선곡이었어요 👍',
  '한 번 듣기 시작하면 계속 무한반복하게 되는 묘하게 중독성 있는 노래인 것 같아요',
  '오랜만에 나온 진짜 명곡이라 주변 사람들한테도 자꾸 추천하고 다니게 되는 곡이에요',
  '이 노래 나온 뒤로 다른 곡은 잘 안 듣게 될 정도로 요즘 무한재생 중이에요',
  '요즘 마음이 복잡할 때마다 이 노래 들으면서 잠깐씩 탈출하는 기분이 들어요',
  '아직 많이 유명하지 않은 것 같은데 혼자만 알고 있고 싶을 정도로 좋은 곡이에요',
  '신곡 나왔길래 들어봤는데 기대했던 것 이상이라 계속 재생목록에 담아두고 듣는 중이에요',
  '이 아티스트 진짜 너무너무 사랑해요, 발매하는 곡마다 다 명곡인 것 같아서 매번 놀라요',
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const DUMMY_SONGS: Song[] = [
  {
    trackId: '5eBM5qATb1IfJvNzGuS2GX',
    title: 'Busy Boy',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    comment: getRandomElement(USER_COMMENTS),
    genres: withRandomGenres('R&B'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    trackId: '3c0anSTjsn20lztbBmZt03',
    title: '미장원',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    comment: getRandomElement(USER_COMMENTS),
    genres: withRandomGenres('R&B'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    trackId: '0kt2S0FV9DEGIOg247sT8b',
    title: '미친건가',
    artist: '주혜린',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273951f05b855b09c8b4d7d2ee5',
    comment: getRandomElement(USER_COMMENTS),
    genres: withRandomGenres('R&B'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    trackId: '4uh6rj3FryYQXMz9zLqDKL',
    title: 'Fly away',
    artist: '권진아',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273bee4779793a1d10af6e8bd4f',
    comment: getRandomElement(USER_COMMENTS),
    genres: withRandomGenres('인디'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    trackId: '171mGT1HdxM2HdqZrWNY31',
    title: '다큐멘터리',
    artist: '윤마치',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b2734c02aacdf6281db79169e115',
    comment: getRandomElement(USER_COMMENTS),
    genres: withRandomGenres('인디'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    trackId: '3aK5mtd4CKxLF6RpC1doh6',
    title: '마음으로',
    artist: '유다빈밴드',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273598f97c45eee469199fd0733',
    comment: getRandomElement(USER_COMMENTS),
    genres: withRandomGenres('발라드'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    trackId: '6W4iF5kAqqwKiVwAk3TcN1',
    title: '하루에 한번씩',
    artist: '거니',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b27382e910c061e1c7555a02a266',
    comment: getRandomElement(USER_COMMENTS),
    genres: withRandomGenres('R&B'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
];

export const DUMMY_MY_SONGS: Song[] = [
  {
    trackId: '3aK5mtd4CKxLF6RpC1doh6',
    title: '마음으로',
    artist: '유다빈밴드',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b273598f97c45eee469199fd0733',
    comment: '요즘 자기 전에 꼭 듣는 곡이라 에리카생들한테도 추천하고 싶어서 올려봐요',
    genres: withRandomGenres('발라드'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
  {
    trackId: '6W4iF5kAqqwKiVwAk3TcN1',
    title: '하루에 한번씩',
    artist: '거니',
    albumArtUrl: 'https://i.scdn.co/image/ab67616d0000b27382e910c061e1c7555a02a266',
    comment: '과제하다 지칠 때 이 노래 들으면 기분전환이 돼서 자주 듣는 곡이에요',
    genres: withRandomGenres('R&B'),
    previewUrl: '',
    createdAt: new Date().toISOString(),
  },
];
