export function getArtistNameSize(name: string): string {
  const visualWidth = Array.from(name).reduce((width, character) => {
    if (/\s/.test(character)) return width + 0.35;
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(character)) return width + 1;
    if (/[A-Z0-9]/.test(character)) return width + 0.76;
    if (/[a-z]/.test(character)) return width + 0.58;
    return width + 0.82;
  }, 0);

  // 두 글자 이름은 강조 크기를 그대로 쓰고, 그보다 긴 이름은 확대 기준의 약 80%로 낮춘다.
  if (visualWidth <= 2) return 'clamp(36px, 11.5cqw, 56px)';
  if (visualWidth <= 4) return 'clamp(29px, 9.2cqw, 45px)';
  if (visualWidth <= 8) return 'clamp(24px, 7.7cqw, 38px)';
  if (visualWidth <= 13) return 'clamp(19px, 6.1cqw, 31px)';
  return 'clamp(15px, 4.7cqw, 24px)';
}

export const ARTIST_PROMO_TEMPLATES = [
  'listen-together',
  'do-you-like',
  'how-about',
] as const;

export type ArtistPromoTemplate = (typeof ARTIST_PROMO_TEMPLATES)[number];

export function pickArtistPromoTemplate(random: () => number = Math.random): ArtistPromoTemplate {
  const index = Math.min(ARTIST_PROMO_TEMPLATES.length - 1, Math.floor(random() * ARTIST_PROMO_TEMPLATES.length));
  return ARTIST_PROMO_TEMPLATES[index];
}
