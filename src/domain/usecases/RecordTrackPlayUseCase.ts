// 유스케이스: 곡 재생 기록 (새 백엔드, 인기차트 집계용) — 재생 버튼이 눌리는 곳 어디서든 호출
import type { PlaylistRepository } from '../repositories/IPlaylistRepository.js';

export interface RecordTrackPlayUseCase {
  execute: (trackId: string) => Promise<void>;
}

export const createRecordTrackPlayUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): RecordTrackPlayUseCase => ({
  execute: (trackId) => playlistRepository.recordTrackPlay(trackId),
});
