// 유스케이스: 곡추천하기/검색결과 화면의 Spotify 곡 검색
import type { MusicSearchTrack } from '../entities/MusicSearchTrack.js';
import type { MusicSearchRepository } from '../repositories/IMusicSearchRepository.js';

export interface SearchMusicTracksUseCase {
  execute: (query: string) => Promise<MusicSearchTrack[]>;
}

export const createSearchMusicTracksUseCase = (
  { musicSearchRepository }: { musicSearchRepository: MusicSearchRepository }
): SearchMusicTracksUseCase => ({
  execute: (query: string) => musicSearchRepository.search(query),
});
