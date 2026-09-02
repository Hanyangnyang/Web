import type { PlaylistSong, PlaylistReaction } from '../../../domain/entities/PlaylistSong.js';
import { type ReactionKey } from './postReactions';

export type { PlaylistReaction };

// 곡 하나를 식별하는 데 필요한 최소 정보 — TrackResult(SearchResultsView)/SearchTrack(RecommendSongView)/
// PlayableTrack(FloatingSpotifyPlayer)/SongShareModalSong(SongShareModal)이 전부 이 모양과 동일해서,
// 각 파일에서 이 타입의 별칭으로 재정의해 씀(기존 import 경로는 그대로 유지)
export interface TrackSummary {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
}

// RecentSongsView/BookmarkedSongsView/MySongsView(전부 SongListScreen 위에 얇게 얹힌 화면들)가
// 공통으로 받는 prop — 각 화면은 이걸 extends하고 자기만의 prop(데이터 소스, 빈 상태 문구 등)만 추가
export interface SongListViewBaseProps {
  onBack: () => void;
  onPlay: (song: Song) => void;
  onShowAddSong: () => void;
  // 넘겨주면 카드의 곡명·가수명을 눌렀을 때 이 곡의 게시글 모음(TrackPostCollectionView)으로 이동
  onSelectTrack?: (track: TrackSummary) => void;
  // 지금 하단 플레이어에서 재생 중인 곡
  currentTrackId?: string | null;
  // 뷰 모드(그리드/리스트)를 상위(PlaylistView)에서 제어 — 게시글 상세로 갔다가 뒤로가기로 돌아와도
  // 마지막으로 보던 모드가 유지되게 하기 위함
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export interface Song {
  // 게시글 자체의 id — 실제 API 연동 전 로컬 더미/임시 추가 곡은 없을 수 있어서 옵셔널.
  // 여러 게시글이 같은 trackId(스포티파이 곡)를 가리킬 수 있어서 리스트 key로는 이 값을 우선 써야 함
  id?: string;
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: string[];
  isBookmarked?: boolean;
  // 지금 이 기기가 등록한 게시글인지 — 북마크/신고 아이콘을 숨길지 판단하는 데 씀
  isMine?: boolean;
  reactions?: PlaylistReaction[];
  // react-query 캐시에 그대로 들어가 localStorage에 직렬화되므로 Date 인스턴스가 아니라 ISO 문자열로 유지 —
  // Date로 저장하면 새로고침 후 복원 시 문자열로 풀리면서 formatTimeAgo가 크래시남 (Gym.ts 등 다른 엔티티와 동일한 이유)
  createdAt: string;
}

// data 레이어에서 받아온 도메인 엔티티(PlaylistSong)를 화면에서 쓰는 Song 형태로 변환
export function mapPlaylistSongToSong(song: PlaylistSong): Song {
  return {
    id: song.id,
    trackId: song.trackId,
    title: song.title,
    artist: song.artist,
    albumArtUrl: song.albumArtUrl,
    comment: song.comment,
    genres: song.genres,
    isBookmarked: song.isBookmarked,
    isMine: song.isMine,
    reactions: song.reactions,
    createdAt: song.createdAt,
  };
}

export const GENRES = [
  { key: 'all', label: '전체', emoji: '', light: '', active: '' },
  { key: 'kpop', label: 'K-POP', emoji: '🕺', light: 'bg-[rgba(254,215,170,0.6)]', active: 'bg-[rgba(230,140,60,1)]' },
  { key: 'rock', label: '락', emoji: '🎸', light: 'bg-[rgba(254,202,202,0.6)]', active: 'bg-[rgba(239,68,68,1)]' },
  { key: 'rb', label: 'R&B', emoji: '🎹', light: 'bg-[rgba(251,207,232,0.6)]', active: 'bg-[rgba(219,39,119,1)]' },
  { key: 'hiphop', label: '힙합', emoji: '🎤', light: 'bg-[rgba(233,213,255,0.6)]', active: 'bg-[rgba(147,51,234,1)]' },
  { key: 'indie', label: '인디', emoji: '☁️', light: 'bg-[rgba(191,219,254,0.6)]', active: 'bg-[rgba(59,130,246,1)]' },
  { key: 'band', label: '밴드', emoji: '🥁', light: 'bg-[rgba(165,243,252,0.6)]', active: 'bg-[rgba(6,182,212,1)]' },
  { key: 'ballad', label: '발라드', emoji: '🎻', light: 'bg-[rgba(187,247,208,0.6)]', active: 'bg-[rgba(34,197,94,1)]' },
  { key: 'pop', label: 'POP', emoji: '🗽', light: 'bg-[rgba(153,246,228,0.6)]', active: 'bg-[rgba(20,184,166,1)]' },
  { key: 'jpop', label: 'J-POP', emoji: '🎏', light: 'bg-[rgba(254,240,138,0.6)]', active: 'bg-[rgba(202,138,4,1)]' },
  // 다른 장르에서 안 쓴 색상 계열로 — Tailwind orange-600(진한 주황)은 K-POP의 톤 다운된
  // 커스텀 오렌지(230,140,60)보다 훨씬 채도 높고 진해서 구분되고, light도 200이 아닌 300 계열로
  // 밝기를 달리 잡아 K-POP light(254,215,170)와 안 겹치게 함
  { key: 'ost', label: 'OST', emoji: '🎬', light: 'bg-[rgba(253,186,116,0.6)]', active: 'bg-[rgba(234,88,12,1)]' },
  { key: 'other', label: '기타', emoji: '🎧', light: 'bg-[rgba(229,231,235,0.6)]', active: 'bg-[rgba(107,114,128,1)]' },
];

// 인기차트 상단 기간 필터 칩 — 홈 미리보기와 인기차트 상세 화면이 공용으로 사용. 실제 기간별 재집계 로직은 추후 연동
export const CHART_PERIOD_OPTIONS = [
  { key: 'popular', label: '실시간' },
  { key: 'weekly', label: '주간' },
  { key: 'monthly', label: '월간' },
] as const;

export type ChartPeriod = (typeof CHART_PERIOD_OPTIONS)[number]['key'];

// selectedGenre는 GENRES의 key('indie' 등), song.genres에는 label('인디' 등)이 들어있어서 변환해서 비교
export function filterSongsByGenre(songs: Song[], selectedGenre: string): Song[] {
  if (selectedGenre === 'all') return songs;
  const label = GENRES.find((genre) => genre.key === selectedGenre)?.label;
  return songs.filter((song) => song.genres.includes(label ?? ''));
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 12 * MONTH_MS;

// 게시글/곡 카드에 공용으로 쓰는 상대 시간 표시 ("12분 전", "3시간 전" 등). ISO 문자열/Date 둘 다 받음.
// null/유효하지 않은 값(예: 곡 등록 직후 API가 createdAt을 null로 내려주는 경우)이 와도 화면이 안 죽게 방어
export function formatTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return '방금 전';
  const time = typeof date === 'string' ? new Date(date).getTime() : date.getTime();
  if (Number.isNaN(time)) return '방금 전';
  const diffMs = Date.now() - time;
  if (diffMs < MINUTE_MS) return '방금 전';
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)}분 전`;
  if (diffMs < DAY_MS) return `${Math.floor(diffMs / HOUR_MS)}시간 전`;
  if (diffMs < MONTH_MS) return `${Math.floor(diffMs / DAY_MS)}일 전`;
  if (diffMs < YEAR_MS) return `${Math.floor(diffMs / MONTH_MS)}달 전`;
  return `${Math.floor(diffMs / YEAR_MS)}년 전`;
}

// 이모지 반응 카드(PostDetailCard/TrackPostCollectionView)가 공용으로 쓰는 로컬 반응 상태
export type ReactionState = Partial<Record<ReactionKey, { count: number; mine: boolean }>>;

// 서버가 내려준 반응 목록을 이모지 키 기준 상태로 변환 — reaction.type이 ReactionKey와 동일한 문자열이라는 전제(예: 'FIRE')
export function toReactionState(reactions?: PlaylistReaction[]): ReactionState {
  const state: ReactionState = {};
  for (const r of reactions ?? []) {
    state[r.type as ReactionKey] = { count: r.count, mine: r.isReacted };
  }
  return state;
}
