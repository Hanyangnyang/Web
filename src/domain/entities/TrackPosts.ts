// 도메인 엔티티: 특정 곡(trackId)에 달린 추천 게시글 모아보기 (새 백엔드 /api/v1/playlist/songs/tracks/{trackId})
import type { PlaylistSong } from './PlaylistSong.js';

export interface TrackPosts {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  totalSongsCount: number;
  // 이 곡에 달린 모든 추천 게시글의 공감(북마크) 수 합계
  totalHeartCount: number;
  // 이 곡의 누적 재생수 — 게시글마다 동일한 값이라 아무 게시글에서나 꺼내 씀(레포지토리에서 계산)
  totalPlayCount: number;
  posts: PlaylistSong[];
}

export function createTrackPosts(raw: TrackPosts): TrackPosts {
  return { ...raw };
}
