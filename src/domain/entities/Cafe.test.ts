import { describe, it, expect } from 'vitest';
import { createCafe } from './Cafe.js';

describe('createCafe', () => {
  it('전달된 필드를 그대로 담는다', () => {
    const cafe = createCafe({
      id: 're12',
      name: '학생식당',
      menus: [{ type: '중식', menu: '<b>제육볶음</b>', price: '5000원' }],
      hasJeyuk: true,
      available: true,
      hours: { 중식: '11:30~13:30' },
    });
    expect(cafe).toEqual({
      id: 're12',
      name: '학생식당',
      menus: [{ type: '중식', menu: '<b>제육볶음</b>', price: '5000원' }],
      hasJeyuk: true,
      available: true,
      hours: { 중식: '11:30~13:30' },
    });
  });

  it('menus/hasJeyuk/available/hours가 없으면 기본값을 쓴다', () => {
    const cafe = createCafe({ id: 're11', name: '교직원식당' });
    expect(cafe.menus).toEqual([]);
    expect(cafe.hasJeyuk).toBe(false);
    expect(cafe.available).toBe(false);
    expect(cafe.hours).toEqual({});
  });
});
