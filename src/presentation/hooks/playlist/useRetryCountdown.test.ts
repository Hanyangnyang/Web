import { describe, it, expect } from 'vitest';
import { getSearchErrorMessage } from './useRetryCountdown.js';
import type { MusicSearchRateLimitError } from '../../../domain/entities/MusicSearchTrack.js';

const httpError = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode }) as MusicSearchRateLimitError;

describe('getSearchErrorMessage', () => {
  it('에러가 없으면 null', () => {
    expect(getSearchErrorMessage(null, 0)).toBeNull();
    expect(getSearchErrorMessage(undefined, 5)).toBeNull();
  });

  it('429 대기 중이면 남은 초를 담은 안내 문구를 보여준다', () => {
    expect(getSearchErrorMessage(httpError('제한', 429), 7)).toBe('검색 요청이 많아요. 7초 후 다시 시도해주세요.');
  });

  it('서버가 준 HTTP 에러는 그 메시지를 그대로 보여준다', () => {
    expect(getSearchErrorMessage(httpError('Spotify 검색에 문제가 생겼어요.', 502), 0)).toBe('Spotify 검색에 문제가 생겼어요.');
  });

  it('statusCode가 없는 에러(네트워크 단절·응답 검증 실패)는 기술적 메시지를 숨기고 공통 문구를 보여준다', () => {
    const networkError = new Error('Failed to fetch') as MusicSearchRateLimitError;
    expect(getSearchErrorMessage(networkError, 0)).toBe('검색 중 문제가 생겼어요. 다시 시도해주세요.');
  });
});
