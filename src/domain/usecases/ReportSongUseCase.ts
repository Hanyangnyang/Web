// 유스케이스: 곡 신고하기 (새 백엔드, 게시글 카드 더보기 메뉴)
import type { PlaylistRepository, ReportSongParams } from '../repositories/IPlaylistRepository.js';

export interface ReportSongUseCase {
  execute: (params: ReportSongParams) => Promise<void>;
}

export const createReportSongUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): ReportSongUseCase => ({
  execute: (params) => playlistRepository.reportSong(params),
});
