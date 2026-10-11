import { describe, it, expect } from 'vitest';
import { formatBlockedUntil } from './formatBlockedUntil.js';

// 2026-10-07 13:00 KST 를 "지금"으로 고정
const NOW = new Date('2026-10-07T13:00:00+09:00');

describe('formatBlockedUntil', () => {
  it('값이 없으면 null', () => {
    expect(formatBlockedUntil(null, NOW)).toBeNull();
    expect(formatBlockedUntil(undefined, NOW)).toBeNull();
    expect(formatBlockedUntil('', NOW)).toBeNull();
  });

  it('파싱할 수 없는 문자열이면 null (호출부가 시각 없는 문구로 대체)', () => {
    expect(formatBlockedUntil('not-a-date', NOW)).toBeNull();
  });

  it('같은 날(KST)이면 시:분만 보여준다', () => {
    expect(formatBlockedUntil('2026-10-07T14:30:00+09:00', NOW)).toBe('14:30');
  });

  it('다른 날이면 월/일을 같이 보여준다', () => {
    expect(formatBlockedUntil('2026-10-08T09:05:00+09:00', NOW)).toBe('10월 8일 09:05');
  });

  it('UTC(Z) 표기도 한국 시각으로 바꿔 보여준다', () => {
    // 2026-10-07T05:30Z = 14:30 KST
    expect(formatBlockedUntil('2026-10-07T05:30:00Z', NOW)).toBe('14:30');
  });

  it('타임존 표기가 없으면 서버 기준 한국 시각으로 간주한다', () => {
    expect(formatBlockedUntil('2026-10-07T14:30:00', NOW)).toBe('14:30');
  });

  it('자정은 24:00이 아니라 00:00으로 보여준다', () => {
    expect(formatBlockedUntil('2026-10-08T00:00:00+09:00', NOW)).toBe('10월 8일 00:00');
  });
});
