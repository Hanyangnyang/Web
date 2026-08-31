import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mapServerDayType, mapServerPeriodType, localWeekdayFallback, computeSchedule, computeFullSchedule } from './Shuttle.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('mapServerDayType', () => {
  it('academic/status의 서버 dayType을 로컬 평일/주말 라벨로 매핑한다', () => {
    expect(mapServerDayType('WEEKDAY')).toBe('평일');
    expect(mapServerDayType('WEEKEND')).toBe('주말');
    expect(mapServerDayType('HOLIDAY')).toBe('주말'); // 공휴일은 주말 시간표를 씀
    expect(mapServerDayType('NO_OPERATION')).toBe('주말'); // 호출부가 isOperating으로 먼저 걸러내므로 폴백일 뿐
  });
});

describe('mapServerPeriodType', () => {
  it('academic/status의 서버 periodType을 셔틀 데이터가 쓰는 로컬 기간명으로 매핑한다', () => {
    expect(mapServerPeriodType('SEMESTER')).toBe('학기중');
    expect(mapServerPeriodType('SEASONAL')).toBe('계절학기');
    expect(mapServerPeriodType('VACATION')).toBe('방학중');
  });
});

describe('localWeekdayFallback', () => {
  it('academic/status를 못 받았을 때 실제 요일(토/일)로만 평일/주말을 가른다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25')); // 토요일
    expect(localWeekdayFallback()).toBe('주말');

    vi.setSystemTime(new Date('2026-07-27')); // 월요일
    expect(localWeekdayFallback()).toBe('평일');
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
  // computeSchedule은 이제 currentDay/isOperating을 호출부(useShuttle)가 academic/status로부터
  // 미리 계산해서 넘겨준다 — 함수 내부에서는 더 이상 '오늘'의 요일이나 서버 상태를 직접 판정하지 않는다.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-27')); // 월요일
  });

  it('현재 기간/요일에 맞는 노선만, 정류장 기준 출발·도착 시각으로 매핑한다', () => {
    // '직행' 노선의 기숙사 정류장: off=0, arrLabel=한대앞역, arrOff=15, subway=true
    const result = computeSchedule(allData, '기숙사', 7 * 60 + 50, '평일', true, 0, '학기중');
    expect(result).toEqual([
      { depMin: 480, dep: '08:00', arr: '08:15', arrLabel: '한대앞역', subway: true, route: '직행' },
      { depMin: 510, dep: '08:30', arr: '08:45', arrLabel: '한대앞역', subway: true, route: '직행' },
      { depMin: 540, dep: '09:00', arr: '09:15', arrLabel: '한대앞역', subway: true, route: '직행' },
    ]);
  });

  it('lookback 범위를 벗어난 과거 셔틀은 제외하고, 범위 안 마지막 과거 1개 + 다음 셔틀들을 남긴다', () => {
    const now = 8 * 60 + 40; // 08:40 — 08:00/08:30은 과거, 09:00은 미래
    const result = computeSchedule(allData, '기숙사', now, '평일', true, 15, '학기중');
    // lookback 15분 이내 과거는 08:30 하나뿐 (08:00은 40분 전이라 제외)
    expect(result.map(r => r.dep)).toEqual(['08:30', '09:00']);
  });

  it('모든 셔틀이 이미 지났으면 lookback 안에 있는 것만, 하나도 없으면 마지막 1개만 반환한다', () => {
    const wayPast = 23 * 60; // 23:00 — 전부 과거
    const result = computeSchedule(allData, '기숙사', wayPast, '평일', true, 15, '학기중');
    expect(result).toHaveLength(1);
    expect(result[0].dep).toBe('09:00'); // 마지막 셔틀
  });

  it('isOperating이 false면(academic/status.shuttle.isOperating) 운행 정보가 없다', () => {
    const result = computeSchedule(allData, '기숙사', 480, '평일', false, 0, '학기중');
    expect(result).toEqual([]);
  });

  it('period 생략시 기본값(학기중)으로 동작한다', () => {
    const result = computeSchedule(allData, '기숙사', 0, '평일', true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('computeFullSchedule', () => {
  it('마지막 항목에만 isLast=true를 붙인다', () => {
    const result = computeFullSchedule(allData, '기숙사', '평일', '학기중');
    expect(result.map(r => r.isLast)).toEqual([false, false, true]);
  });

  it('"주말/공휴일" dayType은 데이터의 "주말"과 매칭된다', () => {
    const result = computeFullSchedule(allData, '기숙사', '주말/공휴일', '학기중');
    expect(result.map(r => r.dep)).toEqual(['10:00']);
  });

  it('overridePeriod가 있으면 기본 period보다 우선한다', () => {
    const result = computeFullSchedule(allData, '기숙사', '평일', '학기중', '방학중');
    expect(result.map(r => r.dep)).toEqual(['11:00']);
  });
});
