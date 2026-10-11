import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ArtistPromoBanner } from './ArtistPromoBanner.js';
import { ARTIST_PROMO_TEMPLATES, getArtistNameSize, pickArtistPromoTemplate } from './artistPromoTypography.js';

describe('ArtistPromoBanner', () => {
  it('백엔드에서 받은 가수명과 이미지를 학술정보관 카드와 비슷한 2:1 배너로 렌더링한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(
      <ArtistPromoBanner
        artistName="검정치마"
        artistImageUrl="https://example.com/artist.jpg"
      />,
    );

    expect(screen.getByText('검정치마')).toBeTruthy();
    expect(screen.getByText('같이 들어요')).toBeTruthy();
    expect(screen.getByText('에리카 플레이리스트 바로가기')).toBeTruthy();
    expect(screen.getByTestId('artist-promo-banner').className).toContain('aspect-[2/1]');
    expect(screen.getByAltText('검정치마 아티스트 이미지').getAttribute('src')).toBe('https://example.com/artist.jpg');
  });

  it('클릭 동작이 있으면 접근 가능한 버튼으로 렌더링한다', () => {
    const onClick = vi.fn();
    render(<ArtistPromoBanner artistName="ADOY" artistImageUrl="https://example.com/adoy.jpg" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'ADOY 음악 보러 가기' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('이미지를 불러오지 못하면 가수명 첫 글자를 표시한다', () => {
    render(<ArtistPromoBanner artistName="백예린" artistImageUrl="https://example.com/broken.jpg" />);

    fireEvent.error(screen.getByAltText('백예린 아티스트 이미지'));

    expect(screen.getByText('백')).toBeTruthy();
    expect(screen.queryByAltText('백예린 아티스트 이미지')).toBeNull();
  });

  it('긴 가수명은 말줄임표 없이 전체 이름을 한 줄로 두고 툴팁을 유지한다', () => {
    const longName = 'The Artist With A Very Long Name';
    render(<ArtistPromoBanner artistName={longName} artistImageUrl="https://example.com/long.jpg" />);

    const displayedName = screen.getByText(longName);
    expect(displayedName.className).toContain('whitespace-nowrap');
    expect(displayedName.className).not.toContain('truncate');
    expect(displayedName.getAttribute('title')).toBe(longName);
  });

  it('가수명이 영역을 넘칠 때만 오른쪽 끝 페이드를 적용한다', () => {
    const widths = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get');
    const clientWidths = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get');
    try {
      widths.mockReturnValue(300);
      clientWidths.mockReturnValue(100);
      const { unmount } = render(<ArtistPromoBanner artistName="Hadestown Original Broadway Company" artistImageUrl="https://example.com/a.jpg" />);
      expect(screen.getByText('Hadestown Original Broadway Company').getAttribute('data-clipped')).toBe('true');
      unmount();

      widths.mockReturnValue(100);
      render(<ArtistPromoBanner artistName="원필" artistImageUrl="https://example.com/b.jpg" />);
      expect(screen.getByText('원필').getAttribute('data-clipped')).toBe('false');
    } finally {
      widths.mockRestore();
      clientWidths.mockRestore();
    }
  });

  it('가수명의 시각적 길이에 따라 글자 크기를 다르게 적용한다', () => {
    expect(getArtistNameSize('원필')).toBe('clamp(36px, 11.5cqw, 56px)');
    expect(getArtistNameSize('The Artist With A Very Long Name')).toBe('clamp(15px, 4.7cqw, 24px)');
  });

  it('다섯 가지 문구 템플릿을 무작위 값에 맞춰 선택한다', () => {
    expect(ARTIST_PROMO_TEMPLATES).toHaveLength(5);
    expect(pickArtistPromoTemplate(() => 0)).toBe('listen-together');
    expect(pickArtistPromoTemplate(() => 0.2)).toBe('do-you-like');
    expect(pickArtistPromoTemplate(() => 0.4)).toBe('how-about');
    expect(pickArtistPromoTemplate(() => 0.6)).toBe('give-it-a-listen');
    expect(pickArtistPromoTemplate(() => 0.8)).toBe('want-to-listen');
    expect(pickArtistPromoTemplate(() => 0.99)).toBe('want-to-listen');
  });

  it('추가한 추천 문구를 렌더링한다', () => {
    const { rerender } = render(<ArtistPromoBanner artistName="잔나비" artistImageUrl={null} template="give-it-a-listen" />);
    expect(screen.getByText('들어보세요')).toBeTruthy();

    rerender(<ArtistPromoBanner artistName="잔나비" artistImageUrl={null} template="want-to-listen" />);
    expect(screen.getByText('들어볼래요?')).toBeTruthy();
  });
});
