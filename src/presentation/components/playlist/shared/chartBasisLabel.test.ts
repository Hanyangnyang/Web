import { describe, it, expect } from 'vitest';
import { toChartBasisLabel } from './chartBasisLabel';

const NOW = new Date(2026, 9, 13, 14, 0); // 2026-10-13 14:00 (로컬)

describe('toChartBasisLabel', () => {
  it('실시간: 오늘 스냅샷이면 시각만 남긴다', () => {
    expect(toChartBasisLabel('10.13 12:00 기준 실시간 급상승', NOW)).toBe('12:00 기준');
  });

  it('실시간: 오늘이 아니면 날짜를 남긴다', () => {
    expect(toChartBasisLabel('10.12 23:00 기준 실시간 급상승', NOW)).toBe('10.12 23:00 기준');
  });

  it('주간: "N월 N주차"만 남긴다', () => {
    expect(toChartBasisLabel('10월 2주차 주간 차트', NOW)).toBe('10월 2주차');
  });

  it('월간: 올해면 월만 남긴다', () => {
    expect(toChartBasisLabel('2026년 9월 월간 차트', NOW)).toBe('9월');
  });

  it('월간: 올해가 아니면 연도를 남긴다', () => {
    expect(toChartBasisLabel('2025년 12월 월간 차트', NOW)).toBe('2025년 12월');
  });

  it('알 수 없는 형태나 빈 값은 표시하지 않는다', () => {
    expect(toChartBasisLabel('인기 차트', NOW)).toBeNull();
    expect(toChartBasisLabel('', NOW)).toBeNull();
    expect(toChartBasisLabel(undefined, NOW)).toBeNull();
  });
});
