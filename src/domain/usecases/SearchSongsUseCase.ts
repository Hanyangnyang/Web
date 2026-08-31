// 유스케이스: 추천글 가중치 통합 검색(제목/가수/코멘트) (새 백엔드, 검색 결과 화면의 "게시글" 섹션)
import type { PlaylistSong } from '../entities/PlaylistSong.js';
import type { PlaylistRepository, SearchSongsParams } from '../repositories/IPlaylistRepository.js';

export interface SearchSongsUseCase {
  execute: (params: SearchSongsParams) => Promise<PlaylistSong[]>;
}

export const createSearchSongsUseCase = (
  { playlistRepository }: { playlistRepository: PlaylistRepository }
): SearchSongsUseCase => ({
  execute: (params) => playlistRepository.searchSongs(params),
});
