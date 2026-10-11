// 유스케이스: 곡 등록 전 사용자 기기 상태(1일 등록 제한, 최근 7일 중복 추천) 조회 (새 백엔드, 곡추천하기 화면)
import type { SongCreationStatus } from '../entities/SongCreationStatus.js';
import type { PlaylistRepository, GetSongCreationStatusParams } from '../repositories/IPlaylistRepository.js';

export interface GetSongCreationStatusUseCase {
  execute: (params: GetSongCreationStatusParams) => Promise<SongCreationStatus>;
}

export const createGetSongCreationStatusUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): GetSongCreationStatusUseCase => ({
  execute: (params) => playlistRepository.getSongCreationStatus(params),
});
