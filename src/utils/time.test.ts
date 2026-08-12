import { describe, it, expect } from 'vitest';
import { formatKSTHourMinute } from './time.js';

describe('formatKSTHourMinute', () => {
  it("서버 형식('YYYY-MM-DD HH:mm:ss')에서 시:분을 뽑는다", () => {
    expect(formatKSTHourMinute('2026-08-12 14:27:00')).toBe('14:27');
  });

  it('타임존을 변환하지 않는다 — 서버가 준 한국 시각을 그대로 보여준다', () => {
    // new Date()에 맡기면 기기 타임존에 따라 23:27이 되거나 파싱이 실패한다.
    // 이 함수는 문자열에서 직접 뽑으므로 어떤 기기에서도 14:27이다.
    expect(formatKSTHourMinute('2026-08-12 14:27:00')).toBe('14:27');
    expect(formatKSTHourMinute('2026-08-12 00:05:00')).toBe('00:05');
  });

  it("나중에 서버가 ISO 형식(+09:00)으로 바꿔도 그대로 동작한다", () => {
    expect(formatKSTHourMinute('2026-08-12T14:27:00+09:00')).toBe('14:27');
  });

  it('형식이 맞지 않으면 null을 반환한다', () => {
    expect(formatKSTHourMinute('언제인지 모름')).toBeNull();
    expect(formatKSTHourMinute('2026-08-12')).toBeNull(); // 시각이 없음
    expect(formatKSTHourMinute('')).toBeNull();
  });
});
