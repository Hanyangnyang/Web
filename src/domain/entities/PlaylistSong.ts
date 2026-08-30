// 도메인 엔티티: 에리카 플레이리스트 피드에 올라온 곡 게시글 (새 백엔드 /api/v1/playlist/songs)
export interface PlaylistReaction {
  type: string;
  emoji: string;
  count: number;
  isReacted: boolean;
}

export interface PlaylistSong {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: string[];
  isBookmarked: boolean;
  reactions: PlaylistReaction[];
  createdAt: string; // ISO 문자열 — react-query 캐시 직렬화 안전을 위해 Date 인스턴스로 안 바꿈
}

export function createPlaylistSong(raw: {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: string[];
  isBookmarked: boolean;
  reactions: PlaylistReaction[];
  createdAt: string; // ISO 문자열 — react-query 캐시 직렬화 안전을 위해 Date 인스턴스로 안 바꿈
}): PlaylistSong {
  return {
    id: raw.id,
    trackId: raw.trackId,
    title: raw.title,
    artist: raw.artist,
    albumArtUrl: raw.albumArtUrl,
    comment: raw.comment,
    genres: raw.genres,
    isBookmarked: raw.isBookmarked,
    reactions: raw.reactions,
    createdAt: raw.createdAt,
  };
}
