// 도메인 레포지토리 인터페이스: Spotify 곡 검색 제공 계약 (구현은 data 레이어의 MusicSearchRepository)
import type { MusicSearchTrack } from '../entities/MusicSearchTrack.js';

export interface MusicSearchRepository {
  search: (query: string) => Promise<MusicSearchTrack[]>;
}
