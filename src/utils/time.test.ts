import { describe, it, expect } from 'vitest';
import { formatKSTHourMinute } from './time.js';

describe('formatKSTHourMinute', () => {
  it('UTC 시각을 KST(+9)로 변환한다', () => {
    expect(formatKSTHourMinute('2026-08-12T09:00:00Z')).toBe('18:00');
  });

  it('날짜 경계를 넘어가도 시각만 정확히 뽑는다', () => {
    // UTC 20:30 → KST 다음날 05:30
    expect(formatKSTHourMinute('2026-08-12T20:30:00Z')).toBe('05:30');
  });

  it('이미 +09:00 오프셋이 붙은 값은 그대로 그 시각으로 읽는다', () => {
    // 오프셋을 무시하고 9시간을 또 더하면 안 된다
    expect(formatKSTHourMinute('2026-08-12T14:05:00+09:00')).toBe('14:05');
  });

  it('한 자리 시/분은 0으로 채운다', () => {
    expect(formatKSTHourMinute('2026-08-11T22:03:00Z')).toBe('07:03');
  });

  it('파싱할 수 없는 값이면 null을 반환한다', () => {
    expect(formatKSTHourMinute('언제인지 모름')).toBeNull();
  });
});
