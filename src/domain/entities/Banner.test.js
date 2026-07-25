import { describe, it, expect } from 'vitest';
import { createBanner } from './Banner.js';

describe('createBanner', () => {
  it('snake_case API 필드를 camelCase로 정규화한다', () => {
    const banner = createBanner({
      id: 1,
      image_url: 'https://example.com/a.png',
      click_url: 'https://example.com',
      alt_text: '광고 배너',
    });
    expect(banner).toEqual({
      id: 1,
      imageUrl: 'https://example.com/a.png',
      clickUrl: 'https://example.com',
      altText: '광고 배너',
    });
  });

  it('click_url/alt_text가 없으면 기본값(null / 빈 문자열)을 쓴다', () => {
    const banner = createBanner({ id: 2, image_url: 'https://example.com/b.png' });
    expect(banner.clickUrl).toBeNull();
    expect(banner.altText).toBe('');
  });
});
