// 훅(ViewModel): 최근추가된곡 화면의 플레이리스트 피드 곡 목록 로딩 + 곡 추천/등록/신고/좋아요(북마크)/재생기록/이모지반응
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRecentSongsUseCase,
  submitSongUseCase,
  reportSongUseCase,
  toggleBookmarkUseCase,
  recordTrackPlayUseCase,
  toggleReactionUseCase,
} from '../../di.js';
import { getOrCreateAnonymousUserId } from '../../lib/supabase.js';
import { mapPlaylistSongToSong, type Song, type PlaylistReaction } from '../components/playlist/playlistTypes.js';

const RECENT_SONGS_QUERY_KEY = ['playlist', 'recent-songs'];
const RECENT_SONGS_SIZE = 50;
// 다른 사용자가 방금 추천한 곡이 바로 보여야 하는 실시간성 있는 피드라, 전역 기본값(15분)보다 훨씬 짧게 둠
const RECENT_SONGS_STALE_TIME = 60 * 1000;

export function useRecentSongs() {
  return useQuery<Song[]>({
    queryKey: RECENT_SONGS_QUERY_KEY,
    queryFn: async () => {
      const deviceId = await getOrCreateAnonymousUserId();
      const songs = await getRecentSongsUseCase.execute({ deviceId, size: RECENT_SONGS_SIZE });
      return songs.map(mapPlaylistSongToSong);
    },
    staleTime: RECENT_SONGS_STALE_TIME,
  });
}

export interface SubmitSongInput {
  trackId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  comment: string;
  genres: string[];
}

// 곡 추천/등록 — 성공하면 최근추가된곡 쿼리 캐시 맨 앞에 바로 얹어서, 재조회 없이 즉시 화면에 반영
export function useSubmitSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      const song = await submitSongUseCase.execute({ ...input, deviceId });
      return mapPlaylistSongToSong(song);
    },
    onSuccess: (song) => {
      queryClient.setQueryData<Song[]>(RECENT_SONGS_QUERY_KEY, (prev) => (prev ? [song, ...prev] : [song]));
    },
  });
}

export interface ReportSongInput {
  songId: string;
  reason: string;
}

// 곡 신고하기 — 접수 성공 여부만 필요해서 결과값은 없음
export function useReportSong() {
  return useMutation({
    mutationFn: async ({ songId, reason }: ReportSongInput) => {
      const deviceId = await getOrCreateAnonymousUserId();
      await reportSongUseCase.execute({ songId, deviceId, reason });
    },
  });
}

// 좋아요(북마크) 토글 — 서버가 현재 상태 보고 등록/취소를 알아서 판단하므로 songId만 넘기면 됨.
// 결과 isLiked로 화면 상태를 서버 값과 맞춤(낙관적 업데이트는 호출부에서 처리)
export function useToggleBookmark() {
  return useMutation({
    mutationFn: async (songId: string) => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleBookmarkUseCase.execute({ songId, deviceId });
    },
  });
}

// 재생 버튼이 눌리는 곳 어디서든 호출하는 재생수 기록(인기차트 집계용) — 결과를 화면에서 안 써서 fire-and-forget
export function useRecordTrackPlay() {
  return useMutation({
    mutationFn: (trackId: string) => recordTrackPlayUseCase.execute(trackId),
  });
}

export interface ToggleReactionInput {
  songId: string;
  reactionType: string;
}

// 이모지 반응 토글 — 이모지 버튼이 눌리는 곳 어디서든. 서버가 그 곡의 9종 반응 전체 최신 카운트를
// 함께 내려주므로, 호출부는 결과를 그대로 화면 상태에 덮어씌우면 됨(낙관적 업데이트는 호출부에서 처리)
export function useToggleReaction() {
  return useMutation({
    mutationFn: async (input: ToggleReactionInput): Promise<PlaylistReaction[]> => {
      const deviceId = await getOrCreateAnonymousUserId();
      return toggleReactionUseCase.execute({ ...input, deviceId });
    },
  });
}
