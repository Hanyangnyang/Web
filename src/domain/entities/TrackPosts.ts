// 도메인 엔티티: 특정 곡(trackId)에 달린 추천 게시글 모아보기 (새 백엔드 /api/v1/playlist/songs/tracks/{trackId})
import type { PlaylistSong } from './PlaylistSong.js';

export interface TrackPosts {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  totalSongsCount: number;
  // 이 곡을 좋아요한 사람 수
  likeCount: number;
  // 이 곡의 누적 재생수 (곡 단위 — 추천글이 없어도 있음)
  totalPlayCount: number;
  // 요청 기기가 이 곡을 좋아요했는지 (곡 단위 — 추천글이 없어도 있음)
  isLiked: boolean;
  posts: PlaylistSong[];
  // 이번에 받은 페이지가 마지막인지 — 무한 스크롤이 다음 페이지를 이어 받을지 판단
  last: boolean;
}

export function createTrackPosts(raw: TrackPosts): TrackPosts {
  return { ...raw };
}
