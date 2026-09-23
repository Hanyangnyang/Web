import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isInstagramUrl, extractInstagramUsername, openInstagram } from './instagram.js';

describe('instagram utils', () => {
  describe('isInstagramUrl', () => {
    it('인스타그램 관련 URL들을 올바르게 감지한다', () => {
      expect(isInstagramUrl('https://www.instagram.com/hanyang_erica/')).toBe(true);
      expect(isInstagramUrl('http://instagram.com/hy_erica')).toBe(true);
      expect(isInstagramUrl('https://instagram.com/p/C123456/')).toBe(true);
      expect(isInstagramUrl('instagram://user?username=hanyang_erica')).toBe(true);
      expect(isInstagramUrl('@hanyang_erica')).toBe(true);
    });

    it('인스타그램이 아닌 URL이나 텍스트는 false를 반환한다', () => {
      expect(isInstagramUrl('https://hanyang.life')).toBe(false);
      expect(isInstagramUrl('https://google.com')).toBe(false);
      expect(isInstagramUrl('')).toBe(false);
      expect(isInstagramUrl('random text')).toBe(false);
    });
  });

  describe('extractInstagramUsername', () => {
    it('다양한 형식의 인스타그램 링크/아이디에서 username을 추출한다', () => {
      // 1. 일반 웹 URL
      expect(extractInstagramUsername('https://www.instagram.com/hanyang_erica/')).toBe('hanyang_erica');
      expect(extractInstagramUsername('http://instagram.com/hy.erica?utm_source=ig')).toBe('hy.erica');
      expect(extractInstagramUsername('instagram.com/test_user/')).toBe('test_user');

      // 2. 앱 스킴
      expect(extractInstagramUsername('instagram://user?username=erica_club')).toBe('erica_club');

      // 3. @username
      expect(extractInstagramUsername('@erica_official')).toBe('erica_official');
      expect(extractInstagramUsername('@erica_official?utm_source=ig')).toBe('erica_official');

      // 4. 단순 계정명 문자열
      expect(extractInstagramUsername('pure_username')).toBe('pure_username');
    });

    it('프로필이 아닌 게시물/릴스/탐색 등의 URL은 username으로 추출하지 않고 null을 반환한다', () => {
      expect(extractInstagramUsername('https://www.instagram.com/p/DB12345/')).toBeNull();
      expect(extractInstagramUsername('https://www.instagram.com/reel/C890123/')).toBeNull();
      expect(extractInstagramUsername('https://www.instagram.com/stories/hanyang/123/')).toBeNull();
      expect(extractInstagramUsername('https://www.instagram.com/explore/')).toBeNull();
    });

    it('유효하지 않은 입력은 null을 반환한다', () => {
      expect(extractInstagramUsername('')).toBeNull();
    });
  });

  describe('openInstagram', () => {
    let originalLocation: Location;
    let locationAssignMock: ReturnType<typeof vi.fn>;
    let openSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.useFakeTimers();
      originalLocation = window.location;
      locationAssignMock = vi.fn();

      // window.location mocking
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        href: '',
      } as any;

      openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
      vi.useRealTimers();
      window.location = originalLocation as Location & string;
      openSpy.mockRestore();
    });

    it('계정명이 포함된 웹 URL 입력 시 앱 스킴을 호출하고 타이머 후 웹 폴백을 준비한다', () => {
      openInstagram('https://www.instagram.com/hanyang_erica/');

      // 1. 앱 스킴 호출 확인
      expect(window.location.href).toBe('instagram://user?username=hanyang_erica');

      // 2. 500ms 경과 후 window.open 폴백 호출 확인
      vi.advanceTimersByTime(500);
      expect(openSpy).toHaveBeenCalledWith('https://www.instagram.com/hanyang_erica/', '_blank');
    });

    it('게시물 링크(p/xxx) 입력 시 앱 스킴 대신 일반 웹 링크로 연다', () => {
      const postUrl = 'https://www.instagram.com/p/DB12345/';
      openInstagram(postUrl);

      // 앱 스킴 호출 안 됨
      expect(window.location.href).toBe('');
      // 즉시 window.open
      expect(openSpy).toHaveBeenCalledWith(postUrl, '_blank');
    });
  });
});
