import { describe, it, expect } from 'vitest';
import { COLLEGES, collegeById, collegeByName, collegeLabel } from './College.js';

describe('collegeById', () => {
  it('id로 단과대를 찾는다', () => {
    expect(collegeById('8')?.name).toBe('소프트웨어융합대학');
  });

  it('목록에 없는 id면 undefined', () => {
    expect(collegeById('99')).toBeUndefined();
  });
});

describe('collegeByName', () => {
  it('정식 명칭으로 찾는다', () => {
    expect(collegeByName('공학대학')?.id).toBe('3');
  });

  // 손으로 관리하는 campusBuildings.json의 표기가 흔들려도 칩 색·이모지가 빠지면 안 된다
  it('띄어쓰기 차이를 무시한다', () => {
    expect(collegeByName('LIONS 칼리지')?.id).toBe('1');
    expect(collegeByName('LIONS칼리지')?.id).toBe('1');
    expect(collegeByName(' 소프트웨어 융합대학 ')?.id).toBe('8');
  });

  it('대소문자를 무시한다', () => {
    expect(collegeByName('lions칼리지')?.id).toBe('1');
  });

  // 대학본부·사회교육원·학군단은 단과대가 아니라 못 찾는 게 정상 — 호출부가 중립색으로 떨어뜨린다
  it('단과대가 아닌 값은 undefined를 돌려준다', () => {
    expect(collegeByName('대학본부')).toBeUndefined();
    expect(collegeByName('학군단')).toBeUndefined();
  });
});

describe('collegeLabel', () => {
  it('displayName이 있으면 그것을 쓴다 (좁은 칩에서 두 줄로 끊기 위해)', () => {
    expect(collegeLabel('8', '무시됨')).toBe('소프트웨어\n융합대학');
  });

  it('displayName이 없으면 정식 명칭을 쓴다', () => {
    expect(collegeLabel('3', '무시됨')).toBe('공학대학');
  });

  it('모르는 id면 데이터가 준 이름으로 물러선다 (칸이 비지 않게)', () => {
    expect(collegeLabel('99', '신설대학')).toBe('신설대학');
  });
});

describe('COLLEGES 데이터 자체의 무결성', () => {
  it('id와 이름이 중복되지 않는다', () => {
    expect(new Set(COLLEGES.map((c) => c.id)).size).toBe(COLLEGES.length);
    expect(new Set(COLLEGES.map((c) => c.name)).size).toBe(COLLEGES.length);
  });

  it('모든 단과대가 이모지를 갖는다', () => {
    expect(COLLEGES.filter((c) => !c.emoji)).toEqual([]);
  });
});
