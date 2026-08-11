import { describe, it, expect } from 'vitest';
import { distanceMeters, formatDistance } from './campusGeo.js';

describe('distanceMeters', () => {
  it('같은 좌표면 0이다', () => {
    expect(distanceMeters(37.3, 126.83, 37.3, 126.83)).toBe(0);
  });

  it('위도 0.001도 차이는 약 111m다 (평면 근사)', () => {
    expect(distanceMeters(37.3, 126.83, 37.301, 126.83)).toBeCloseTo(111, 0);
  });

  it('방향이 반대여도 거리는 같다', () => {
    const a = distanceMeters(37.2983, 126.8388, 37.3008, 126.8385);
    const b = distanceMeters(37.3008, 126.8385, 37.2983, 126.8388);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('formatDistance', () => {
  it('1km 미만은 미터 정수로 표기한다', () => {
    expect(formatDistance(0)).toBe('0m');
    expect(formatDistance(12.4)).toBe('12m');
    expect(formatDistance(999)).toBe('999m');
  });

  // 1km가 m ↔ km 표기가 갈리는 경계라 양쪽을 다 고정해둔다
  it('1km 이상은 소수점 한 자리 km로 표기한다', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(1234)).toBe('1.2km');
    expect(formatDistance(2450)).toBe('2.5km');
  });

  it('아무리 멀어도 km 표기를 유지한다 (상한을 두지 않는다)', () => {
    expect(formatDistance(15000)).toBe('15.0km');
  });
});
