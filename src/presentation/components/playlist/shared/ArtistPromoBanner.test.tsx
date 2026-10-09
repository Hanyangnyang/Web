import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ArtistPromoBanner } from './ArtistPromoBanner.js';
import { ARTIST_PROMO_TEMPLATES, getArtistNameSize, pickArtistPromoTemplate, truncateArtistName } from './artistPromoTypography.js';

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
    expect(screen.getByText('에리카 플레이리스트로 이동하기')).toBeTruthy();
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

  it('긴 가수명도 한 줄 영역과 전체 이름 툴팁을 유지한다', () => {
    const longName = 'The Artist With A Very Long Name';
    render(<ArtistPromoBanner artistName={longName} artistImageUrl="https://example.com/long.jpg" />);

    const displayedName = screen.getByText('The Artist With A Very…');
    expect(displayedName.className).toContain('truncate');
    expect(displayedName.getAttribute('title')).toBe(longName);
  });

  it('가수명의 시각적 길이에 따라 글자 크기를 다르게 적용한다', () => {
    expect(getArtistNameSize('원필')).toBe('clamp(42px, 13.5cqw, 66px)');
    expect(getArtistNameSize('The Artist With A Very Long Name')).toBe('clamp(17px, 5.5cqw, 28px)');
  });

  it('두 가지 문구 템플릿을 무작위 값에 맞춰 선택한다', () => {
    expect(ARTIST_PROMO_TEMPLATES).toHaveLength(2);
    expect(pickArtistPromoTemplate(() => 0)).toBe('listen-together');
    expect(pickArtistPromoTemplate(() => 0.49)).toBe('listen-together');
    expect(pickArtistPromoTemplate(() => 0.5)).toBe('do-you-like');
    expect(pickArtistPromoTemplate(() => 0.99)).toBe('do-you-like');
  });

  it('한글과 영문에 서로 다른 글자 수 기준으로 말줄임한다', () => {
    expect(truncateArtistName('가나다라마바사아자차')).toBe('가나다라마바사아…');
    expect(truncateArtistName('Hadestown Original Broadway Company')).toBe('Hadestown Original Bro…');
    expect(truncateArtistName('유다빈밴드')).toBe('유다빈밴드');
  });
});
