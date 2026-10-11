// 훅(ViewModel): 429(요청 제한) 응답의 Retry-After(초)를 받아 "N초 후 다시 시도" 카운트다운을 돌려줌.
// 에러가 바뀌거나 사라지면 카운트다운도 초기화되고, 0이 되면 isBlocked=false로 재검색이 다시 열림.
// 약간의 지터를 더해, 동시에 제한에 걸린 여러 기기가 같은 순간에 다시 몰리지 않게 함
import { useEffect, useState } from 'react';
import type { MusicSearchRateLimitError } from '../../../domain/entities/MusicSearchTrack.js';

const MAX_JITTER_MS = 1000;

export function useRetryCountdown(error: MusicSearchRateLimitError | null | undefined) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!error?.retryAfterSeconds) {
      setRemainingSeconds(0);
      return;
    }
    const deadline = Date.now() + error.retryAfterSeconds * 1000 + Math.random() * MAX_JITTER_MS;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) clearInterval(timer);
    };
    const timer = setInterval(tick, 500);
    tick();
    return () => clearInterval(timer);
  }, [error]);

  return { remainingSeconds, isBlocked: remainingSeconds > 0 };
}

const GENERIC_SEARCH_ERROR_MESSAGE = '검색 중 문제가 생겼어요. 다시 시도해주세요.';

// 대기 중이면 남은 초를 담은 안내 문구, 서버가 준 HTTP 에러면 그 메시지 그대로.
// statusCode가 없는 에러(네트워크 단절의 "Failed to fetch", 응답 모양 검증 실패의 apiError 등)는
// 개발자용 영문/기술 메시지라 화면에 그대로 노출하지 않고 공통 문구로 바꿈
export function getSearchErrorMessage(error: MusicSearchRateLimitError | null | undefined, remainingSeconds: number): string | null {
  if (!error) return null;
  if (remainingSeconds > 0) return `검색 요청이 많아요. ${remainingSeconds}초 후 다시 시도해주세요.`;
  return error.statusCode ? error.message : GENERIC_SEARCH_ERROR_MESSAGE;
}
