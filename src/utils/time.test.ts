import { describe, it, expect } from 'vitest';
import { formatKSTHourMinute } from './time.js';

describe('formatKSTHourMinute', () => {
  it("서버가 준 UTC 시각('YYYY-MM-DD HH:mm:ss', 오프셋 없음)을 KST(+9)로 변환한다", () => {
    expect(formatKSTHourMinute('2026-08-12 14:27:00')).toBe('23:27');
  });

  it('날짜 경계를 넘어가도 시각만 정확히 뽑는다', () => {
    // UTC 20:30 → KST 다음날 05:30
    expect(formatKSTHourMinute('2026-08-12 20:30:00')).toBe('05:30');
  });

  it('기기 타임존과 무관하게 문자열을 직접 파싱한다 (T/공백 구분자 모두 지원)', () => {
    expect(formatKSTHourMinute('2026-08-12T14:27:00')).toBe('23:27');
    expect(formatKSTHourMinute('2026-08-12 00:05:00')).toBe('09:05');
  });

  it('초가 없어도 시:분은 정확히 변환한다', () => {
    expect(formatKSTHourMinute('2026-08-12 14:27')).toBe('23:27');
  });

  it('형식이 맞지 않으면 null을 반환한다', () => {
    expect(formatKSTHourMinute('언제인지 모름')).toBeNull();
    expect(formatKSTHourMinute('2026-08-12')).toBeNull(); // 시각이 없음
    expect(formatKSTHourMinute('')).toBeNull();
  });
});
