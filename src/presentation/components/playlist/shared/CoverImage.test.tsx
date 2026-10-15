import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CoverImage, COVER_FALLBACK_SRC } from './CoverImage';

describe('CoverImage', () => {
  it('로드에 실패하면 스플래시 하냥이로 바뀐다', () => {
    render(<CoverImage src="https://example.com/broken.jpg" alt="곡" />);

    fireEvent.error(screen.getByAltText('곡'));

    expect(screen.getByAltText('곡').getAttribute('src')).toBe(COVER_FALLBACK_SRC);
  });

  it('URL이 비어 있으면 처음부터 하냥이를 보여준다', () => {
    render(<CoverImage src="" alt="곡" />);

    expect(screen.getByAltText('곡').getAttribute('src')).toBe(COVER_FALLBACK_SRC);
  });

  it('로딩 중에는 하냥이를 배경으로 깔고, 로드되면 배경을 걷는다', () => {
    render(<CoverImage src="https://example.com/a.jpg" alt="곡" />);
    const img = screen.getByAltText('곡');

    expect(img.style.backgroundImage).toContain(COVER_FALLBACK_SRC);
    fireEvent.load(img);
    expect(img.style.backgroundImage).toBe('');
  });

  it('다른 곡으로 바뀌면 이전 곡의 실패 상태가 남지 않는다', () => {
    const { rerender } = render(<CoverImage src="https://example.com/broken.jpg" alt="곡" />);
    fireEvent.error(screen.getByAltText('곡'));

    rerender(<CoverImage src="https://example.com/ok.jpg" alt="곡" />);

    expect(screen.getByAltText('곡').getAttribute('src')).toBe('https://example.com/ok.jpg');
  });
});
