import { describe, expect, it, vi } from 'vitest';
import { createPlaylistRepository } from './PlaylistRepository.js';
import type { PlaylistApiDataSource, PlaylistSongDto } from '../datasources/PlaylistApiDataSource.js';

const edmSong: PlaylistSongDto = {
  id: 'song-1',
  trackId: 'track-1',
  title: 'EDM Song',
  artist: 'DJ',
  albumArtUrl: 'https://example.com/album.jpg',
  comment: '추천합니다',
  genres: ['EDM'],
  isLiked: false,
  reactions: [],
  createdAt: '2026-10-12T00:00:00.000Z',
  deviceId: 'device-1',
  totalPlayCount: 0,
};

describe('PlaylistRepository EDM genre', () => {
  it('EDM 응답을 화면 표시명으로 유지한다', async () => {
    const repository = createPlaylistRepository({
      playlistApiDataSource: {
        getSongs: vi.fn().mockResolvedValue({
          success: true,
          data: { content: [edmSong], last: true },
          _requestUrl: '/api/v1/playlist/songs?genre=EDM',
        }),
      } as unknown as PlaylistApiDataSource,
    });

    const result = await repository.getRecentSongs({ genre: 'EDM' });

    expect(result.songs[0].genres).toEqual(['EDM']);
  });

  it('곡 등록 시 EDM을 백엔드 enum으로 전달한다', async () => {
    const postSong = vi.fn().mockResolvedValue({
      success: true,
      data: edmSong,
      _requestUrl: '/api/v1/playlist/songs',
    });
    const repository = createPlaylistRepository({
      playlistApiDataSource: { postSong } as unknown as PlaylistApiDataSource,
    });

    await repository.submitSong({
      trackId: edmSong.trackId,
      title: edmSong.title,
      artist: edmSong.artist,
      albumArtUrl: edmSong.albumArtUrl,
      comment: edmSong.comment,
      deviceId: edmSong.deviceId,
      genres: ['EDM', 'POP'],
    });

    expect(postSong).toHaveBeenCalledWith(expect.objectContaining({ genres: ['EDM', 'POP'] }));
  });
});
