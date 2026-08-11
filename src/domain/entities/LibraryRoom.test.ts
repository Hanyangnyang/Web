import { describe, it, expect } from 'vitest';
import { createLibraryRoom } from './LibraryRoom.js';

describe('createLibraryRoom', () => {
  it('점유율 33% 이하면 쾌적으로 분류한다', () => {
    const room = createLibraryRoom({ id: 'FIRST_READING_ROOM', name: '제1열람실', total: 100, occupied: 33, available: 67 });
    expect(room.ratio).toBeCloseTo(0.33);
    expect(room.status).toBe('쾌적');
  });

  it('점유율이 33% 초과 50% 이하면 보통으로 분류한다', () => {
    const room = createLibraryRoom({ id: 'FIRST_READING_ROOM', name: '제1열람실', total: 100, occupied: 40, available: 60 });
    expect(room.status).toBe('보통');
  });

  it('점유율이 50% 초과 67% 이하면 혼잡으로 분류한다', () => {
    const room = createLibraryRoom({ id: 'FIRST_READING_ROOM', name: '제1열람실', total: 100, occupied: 60, available: 40 });
    expect(room.status).toBe('혼잡');
  });

  it('점유율이 67% 초과면 매우 혼잡으로 분류한다', () => {
    const room = createLibraryRoom({ id: 'FIRST_READING_ROOM', name: '제1열람실', total: 100, occupied: 68, available: 32 });
    expect(room.status).toBe('매우 혼잡');
  });

  it('경계값(정확히 33%, 50%, 67%)은 "초과"가 아니라 그 아래 등급으로 분류한다', () => {
    // 코드가 > 를 쓰지 >= 가 아니라서, 정확히 그 비율이면 다음 등급으로 안 넘어감
    expect(createLibraryRoom({ id: 'QUIET_ROOM', name: 'a', total: 100, occupied: 33, available: 67 }).status).toBe('쾌적');
    expect(createLibraryRoom({ id: 'QUIET_ROOM', name: 'a', total: 100, occupied: 50, available: 50 }).status).toBe('보통');
    expect(createLibraryRoom({ id: 'QUIET_ROOM', name: 'a', total: 100, occupied: 67, available: 33 }).status).toBe('혼잡');
  });

  it('id/name/total/occupied/available 필드를 그대로 보존한다', () => {
    // available은 total - occupied로 계산하지 않고 서버 값을 그대로 쓴다.
    // 사용 불가 좌석이 있으면 둘이 어긋나는데(218-100=118 ≠ 110), 그때도 서버 값이 살아남아야 한다.
    const room = createLibraryRoom({ id: 'SECOND_READING_ROOM', name: '제2열람실 (4F)', total: 218, occupied: 100, available: 110 });
    expect(room.id).toBe('SECOND_READING_ROOM');
    expect(room.name).toBe('제2열람실 (4F)');
    expect(room.total).toBe(218);
    expect(room.occupied).toBe(100);
    expect(room.available).toBe(110);
  });
});
