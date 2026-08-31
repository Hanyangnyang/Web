// 도메인 엔티티: 특정 곡(trackId)에 달린 추천 게시글 모아보기 (새 백엔드 /api/v1/playlist/songs/tracks/{trackId})
import type { PlaylistSong } from './PlaylistSong.js';

export interface TrackPosts {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  totalSongsCount: number;
  posts: PlaylistSong[];
}

export function createTrackPosts(raw: {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  totalSongsCount: number;
  posts: PlaylistSong[];
}): TrackPosts {
  return {
    trackId: raw.trackId,
    title: raw.title,
    artist: raw.artist,
    albumArtUrl: raw.albumArtUrl,
    totalSongsCount: raw.totalSongsCount,
    posts: raw.posts,
  };
}
