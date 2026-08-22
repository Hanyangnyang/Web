import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dayType, computeSchedule, computeFullSchedule } from './Shuttle.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('dayType', () => {
  it('force_weekend가 true면 실제 요일과 무관하게 항상 주말이다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27')); // 월요일
    expect(dayType(false, [], true)).toBe('주말');
  });

  it('서버가 휴일이라고 하면(isHolidayServer=true) 요일과 무관하게 주말이다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27')); // 월요일
    expect(dayType(true, [], false)).toBe('주말');
  });

  it('오늘 날짜가 custom_holidays에 있으면 평일이어도 주말로 취급한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27')); // 월요일이지만 임시공휴일 지정
    expect(dayType(false, ['2026-07-27'], false)).toBe('주말');
  });

  it('아무 조건도 없으면 실제 요일(토/일)로 판정한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25')); // 토요일
    expect(dayType(false, [], false)).toBe('주말');

    vi.setSystemTime(new Date('2026-07-27')); // 월요일
    expect(dayType(false, [], false)).toBe('평일');
  });
});

const allData = [
  { route: '직행', period: '학기중', dayType: '평일', dep: '08:00' },
  { route: '직행', period: '학기중', dayType: '평일', dep: '08:30' },
  { route: '직행', period: '학기중', dayType: '평일', dep: '09:00' },
  { route: '직행', period: '학기중', dayType: '주말', dep: '10:00' },
  { route: '직행', period: '방학중', dayType: '평일', dep: '11:00' },
];

describe('computeSchedule', () => {
  // computeSchedule은 dayType 인자를 받지 않고 내부에서 '오늘'의 요일을 직접 읽는다.
  // 시간을 고정하지 않으면 토·일에 돌릴 때 평일 데이터가 통째로 걸러져(주말 10:00만 남아)
  // 아래 기대값들이 전부 깨진다 — 실제로 그렇게 실패하고 있었다.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27')); // 월요일
  });

  it('현재 기간/요일에 맞는 노선만, 정류장 기준 출발·도착 시각으로 매핑한다', () => {
    // '직행' 노선의 기숙사 정류장: off=0, arrLabel=한대앞역, arrOff=15, subway=true
    const result = computeSchedule(allData, '기숙사', 7 * 60 + 50, false, 0, { current_period: '학기중' });
    expect(result).toEqual([
      { depMin: 480, dep: '08:00', arr: '08:15', arrLabel: '한대앞역', subway: true, route: '직행' },
      { depMin: 510, dep: '08:30', arr: '08:45', arrLabel: '한대앞역', subway: true, route: '직행' },
      { depMin: 540, dep: '09:00', arr: '09:15', arrLabel: '한대앞역', subway: true, route: '직행' },
    ]);
  });

  it('lookback 범위를 벗어난 과거 셔틀은 제외하고, 범위 안 마지막 과거 1개 + 다음 셔틀들을 남긴다', () => {
    const now = 8 * 60 + 40; // 08:40 — 08:00/08:30은 과거, 09:00은 미래
    const result = computeSchedule(allData, '기숙사', now, false, 15, { current_period: '학기중' });
    // lookback 15분 이내 과거는 08:30 하나뿐 (08:00은 40분 전이라 제외)
    expect(result.map(r => r.dep)).toEqual(['08:30', '09:00']);
  });

  it('모든 셔틀이 이미 지났으면 lookback 안에 있는 것만, 하나도 없으면 마지막 1개만 반환한다', () => {
    const wayPast = 23 * 60; // 23:00 — 전부 과거
    const result = computeSchedule(allData, '기숙사', wayPast, false, 15, { current_period: '학기중' });
    expect(result).toHaveLength(1);
    expect(result[0].dep).toBe('09:00'); // 마지막 셔틀
  });

  it('force_no_operation이면 운행 정보가 없다', () => {
    const result = computeSchedule(allData, '기숙사', 480, false, 0, { current_period: '학기중', force_no_operation: true });
    expect(result).toEqual([]);
  });

  it('appConfig 없이 호출해도 기본값(학기중/공휴일 아님)으로 동작한다', () => {
    const result = computeSchedule(allData, '기숙사', 0, null);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('computeFullSchedule', () => {
  it('마지막 항목에만 isLast=true를 붙인다', () => {
    const result = computeFullSchedule(allData, '기숙사', '평일', { current_period: '학기중' });
    expect(result.map(r => r.isLast)).toEqual([false, false, true]);
  });

  it('"주말/공휴일" dayType은 데이터의 "주말"과 매칭된다', () => {
    const result = computeFullSchedule(allData, '기숙사', '주말/공휴일', { current_period: '학기중' });
    expect(result.map(r => r.dep)).toEqual(['10:00']);
  });

  it('overridePeriod가 있으면 appConfig.current_period보다 우선한다', () => {
    const result = computeFullSchedule(allData, '기숙사', '평일', { current_period: '학기중' }, '방학중');
    expect(result.map(r => r.dep)).toEqual(['11:00']);
  });
});
