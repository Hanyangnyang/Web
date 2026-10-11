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
  isLiked: boolean;
  // 요청한 기기 자신이 등록한 게시글인지 — 신고 아이콘을 숨길지 판단하는 데 씀
  isMine: boolean;
  reactions: PlaylistReaction[];
  // 곡을 좋아요한 사람 수 — 저장한 곡 목록에서만 채워짐
  likeCount?: number;
  createdAt: string; // ISO 문자열 — react-query 캐시 직렬화 안전을 위해 Date 인스턴스로 안 바꿈
}

export function createPlaylistSong(raw: PlaylistSong): PlaylistSong {
  return { ...raw };
}

// 페이지 단위 목록 응답 — last는 서버가 알려주는 "마지막 페이지인지" (무한 스크롤이 다음 페이지를 이어 받을지 판단)
export interface PlaylistSongPage {
  songs: PlaylistSong[];
  last: boolean;
}
