import { useState, useEffect, useCallback, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import type { PlayableTrack, FloatingSpotifyPlayerHandle } from '../../components/playlist/shared/FloatingSpotifyPlayer';
import { useRecordTrackPlay } from './useRecordTrackPlay';
import type { RecentSongsPlaySurface, RecentSongsTapAreaVariant } from './usePlaylistExperiment';

const SUSTAINED_PLAY_THRESHOLD_MS = 3000; // 재생 시작 후 이만큼 지속돼야 "진짜 재생"으로 집계(오탭 걸러내기 — docs/playlist-recent-songs-ab-test.md 참고)
const TRACK_PLAY_THROTTLE_MS = 10 * 1000; // 같은 곡을 연타/실수로 여러 번 눌러도 인기차트 재생수가 과하게 부풀지 않도록, 트랙별로 이 시간 안엔 재생기록을 다시 안 보냄

/**
 * 플레이리스트 하단 플로팅 Spotify 플레이어의 상태(로드된 곡·재생/일시정지·높이)와
 * 재생 버튼 동작(handlePlay: 토글/새 곡 로드 + 재생수 기록 + A/B 테스트 지표 캡처)을 한곳에 모음.
 * recentSongsVariant는 A/B 테스트 지표에 실어 보낼 배정값 — PlaylistView도 쓰므로 밖에서 받음
 */
export function usePlaylistPlayer(recentSongsVariant: RecentSongsTapAreaVariant) {
  const posthog = usePostHog();
  const { mutate: recordTrackPlay } = useRecordTrackPlay();

  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  // FloatingSpotifyPlayer(Spotify iframe)가 실제로 보고하는 재생/일시정지 상태 — currentTrack은
  // "어떤 곡이 로드돼 있는지"만 알려주고 재생 중인지는 몰라서 별도로 들고 있어야 함
  const [isPaused, setIsPaused] = useState(true);
  // FloatingSpotifyPlayer가 실측해서 올려주는 카드 높이(px) — 0이면 플레이어 닫힘.
  const [playerHeight, setPlayerHeight] = useState(0);
  const playerRef = useRef<FloatingSpotifyPlayerHandle>(null);

  // 카드들에 "지금 이 트랙이 재생 중"이라고 넘겨줄 값 — 로드만 돼 있고 일시정지 상태면 null로 취급해서,
  // 그 카드의 재생 버튼이 계속 재생 아이콘(▶)으로 보이고 다시 누르면 이어재생되게 함
  const playingTrackId = isPaused ? null : (currentTrack?.trackId ?? null);

  // trackId별 마지막 재생기록 전송 시각 — 리렌더와 무관하게 유지돼야 해서 state가 아니라 ref
  const lastPlayRecordedAtRef = useRef<Map<string, number>>(new Map());

  // 재생이 3초 이상 지속됐는지 검사할 때 최신 재생 상태를 읽기 위한 ref — setTimeout 콜백은 handlePlay가
  // 만들어진 시점의 state를 그대로 들고 있어서(클로저), 그 사이 다른 곡을 누르거나 멈춘 최신 상태를 못 봄
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  const currentTrackRef = useRef(currentTrack);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  const sustainedPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 재생 버튼이 어디서 눌리든(최근추가곡/인기차트/검색/게시글 등) 이 함수 하나로 모임 — 같은 곡이 이미
  // 로드돼 있으면 재생/일시정지만 토글하고, 다른 곡이면 새로 로드해서 재생 + 재생수 기록(트랙별 스로틀 적용).
  // surface를 넘기면 "최근 추가된 곡" A/B 테스트 지표(재생 시작/3초 이상 지속)를 표면별로 캡처함
  // (docs/playlist-recent-songs-ab-test.md 참고) — 다른 화면(검색/인기차트/게시글 등)에서 부를 땐 surface를 안 넘겨서 캡처 안 함
  const handlePlay = useCallback((track: PlayableTrack, surface?: RecentSongsPlaySurface) => {
    if (currentTrack?.trackId === track.trackId) {
      if (isPaused) {
        playerRef.current?.resume();
        setIsPaused(false);
      } else {
        playerRef.current?.pause();
        setIsPaused(true);
      }
      return;
    }

    if (surface) {
      posthog?.capture('playlist_recent_song_play', { surface, variant: recentSongsVariant, track_id: track.trackId });
      if (sustainedPlayTimeoutRef.current) clearTimeout(sustainedPlayTimeoutRef.current);
      sustainedPlayTimeoutRef.current = setTimeout(() => {
        if (currentTrackRef.current?.trackId === track.trackId && !isPausedRef.current) {
          posthog?.capture('playlist_recent_song_play_sustained', { surface, variant: recentSongsVariant, track_id: track.trackId });
        }
      }, SUSTAINED_PLAY_THRESHOLD_MS);
    }

    setCurrentTrack(track);
    setIsPaused(false); // 새 곡은 바로 재생을 시도하므로 낙관적으로 반영 — 실제 상태는 playback_update가 뒤이어 보정함

    const now = Date.now();
    const lastRecordedAt = lastPlayRecordedAtRef.current.get(track.trackId) ?? 0;
    if (now - lastRecordedAt < TRACK_PLAY_THROTTLE_MS) return;

    lastPlayRecordedAtRef.current.set(track.trackId, now);
    recordTrackPlay(track.trackId);
  }, [currentTrack, isPaused, recordTrackPlay, posthog, recentSongsVariant]);

  const handleClose = useCallback(() => {
    setCurrentTrack(null);
    setIsPaused(true);
  }, []);

  return {
    playerRef,
    currentTrack,
    playingTrackId,
    playerHeight,
    handlePlay,
    handleClose,
    handlePlaybackStateChange: setIsPaused,
    handlePlayerHeightChange: setPlayerHeight,
  };
}
