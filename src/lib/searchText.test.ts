import { describe, it, expect } from 'vitest';
import { normalizeForSearch, matchesQuery } from './searchText.js';

describe('normalizeForSearch', () => {
  it('띄어쓰기를 모두 제거한다 (가운데 공백 포함)', () => {
    expect(normalizeForSearch(' 제 1 공학관 ')).toBe('제1공학관');
  });

  it('대문자를 소문자로 낮춘다', () => {
    expect(normalizeForSearch('ERICA Hall')).toBe('ericahall');
  });

  it('탭·줄바꿈도 공백으로 보고 지운다', () => {
    expect(normalizeForSearch('학생\t복지\n관')).toBe('학생복지관');
  });
});

describe('matchesQuery', () => {
  // 검색어는 이미 정규화된 상태로 들어온다는 계약
  it('부분 문자열이면 일치로 본다 — 앞이 잘려도 찾힌다', () => {
    expect(matchesQuery('제1공학관', '1공학')).toBe(true);
  });

  it('뒤가 잘려도, 중간만 쳐도 찾힌다', () => {
    expect(matchesQuery('제1공학관', '제1공')).toBe(true);
    expect(matchesQuery('제1공학관', '공학')).toBe(true);
  });

  it('대상의 띄어쓰기·대소문자는 무시된다', () => {
    expect(matchesQuery('더 치킨', '더치킨')).toBe(true);
    expect(matchesQuery('Muse Hall', 'musehall')).toBe(true);
  });

  it('글자 순서가 다르면 일치하지 않는다', () => {
    expect(matchesQuery('제1공학관', '학공1')).toBe(false);
  });
});
