import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BannerCarousel } from './BannerCarousel.js';
import * as instagramUtils from '../../../lib/instagram.js';
import type { Banner } from '../../../domain/entities/Banner.js';

// PostHog 모킹
vi.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

describe('BannerCarousel Instagram Deeplink Integration', () => {
  const sampleInstagramBanner: Banner = {
    id: 1,
    imageUrl: 'https://example.com/banner1.png',
    clickUrl: 'https://www.instagram.com/hanyang_erica/',
    altText: '한양대 인스타 배너',
    displayOrder: 1,
  };

  const sampleNormalBanner: Banner = {
    id: 2,
    imageUrl: 'https://example.com/banner2.png',
    clickUrl: 'https://hanyang.ac.kr',
    altText: '한양대 공지',
    displayOrder: 2,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('인스타그램 URL을 가진 배너를 클릭하면 openInstagram 함수가 호출된다', () => {
    const openInstaSpy = vi.spyOn(instagramUtils, 'openInstagram').mockImplementation(() => {});
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<BannerCarousel banners={[sampleInstagramBanner]} loading={false} />);

    const img = screen.getByAltText('한양대 인스타 배너');
    fireEvent.click(img);

    expect(openInstaSpy).toHaveBeenCalledWith('https://www.instagram.com/hanyang_erica/');
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('일반 외부 링크 배너를 클릭하면 window.open이 호출된다', () => {
    const openInstaSpy = vi.spyOn(instagramUtils, 'openInstagram').mockImplementation(() => {});
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<BannerCarousel banners={[sampleNormalBanner]} loading={false} />);

    const img = screen.getByAltText('한양대 공지');
    fireEvent.click(img);

    expect(openInstaSpy).not.toHaveBeenCalled();
    expect(windowOpenSpy).toHaveBeenCalledWith('https://hanyang.ac.kr', '_blank');
  });
});
