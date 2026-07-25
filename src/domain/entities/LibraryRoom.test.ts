import { describe, it, expect } from 'vitest';
import { createLibraryRoom } from './LibraryRoom.js';

describe('createLibraryRoom', () => {
  it('점유율 33% 이하면 쾌적(파랑)으로 분류한다', () => {
    const room = createLibraryRoom({ id: 61, name: '제1열람실', total: 100, occupied: 33 });
    expect(room.ratio).toBeCloseTo(0.33);
    expect(room.status).toBe('쾌적');
    expect(room.color).toBe('#2563eb');
    expect(room.emoji).toBe('🔵');
  });

  it('점유율이 33% 초과 50% 이하면 보통(초록)으로 분류한다', () => {
    const room = createLibraryRoom({ id: 61, name: '제1열람실', total: 100, occupied: 40 });
    expect(room.status).toBe('보통');
    expect(room.color).toBe('#22c55e');
    expect(room.emoji).toBe('🟢');
  });

  it('점유율이 50% 초과 67% 이하면 혼잡(빨강)으로 분류한다', () => {
    const room = createLibraryRoom({ id: 61, name: '제1열람실', total: 100, occupied: 60 });
    expect(room.status).toBe('혼잡');
    expect(room.color).toBe('#ef4444');
    expect(room.emoji).toBe('🔴');
  });

  it('점유율이 67% 초과면 매우 혼잡(진빨강)으로 분류한다', () => {
    const room = createLibraryRoom({ id: 61, name: '제1열람실', total: 100, occupied: 68 });
    expect(room.status).toBe('매우 혼잡');
    expect(room.color).toBe('#991b1b');
    expect(room.emoji).toBe('😫');
  });

  it('경계값(정확히 33%, 50%, 67%)은 "초과"가 아니라 그 아래 등급으로 분류한다', () => {
    // 코드가 > 를 쓰지 >= 가 아니라서, 정확히 그 비율이면 다음 등급으로 안 넘어감
    expect(createLibraryRoom({ id: 1, name: 'a', total: 100, occupied: 33 }).status).toBe('쾌적');
    expect(createLibraryRoom({ id: 1, name: 'a', total: 100, occupied: 50 }).status).toBe('보통');
    expect(createLibraryRoom({ id: 1, name: 'a', total: 100, occupied: 67 }).status).toBe('혼잡');
  });

  it('id/name/total/occupied 필드를 그대로 보존한다', () => {
    const room = createLibraryRoom({ id: 63, name: '제2열람실 (4F)', total: 218, occupied: 100 });
    expect(room.id).toBe(63);
    expect(room.name).toBe('제2열람실 (4F)');
    expect(room.total).toBe(218);
    expect(room.occupied).toBe(100);
  });
});
