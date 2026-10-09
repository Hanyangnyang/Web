export function getArtistNameSize(name: string): string {
  const visualWidth = Array.from(name).reduce((width, character) => {
    if (/\s/.test(character)) return width + 0.35;
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(character)) return width + 1;
    if (/[A-Z0-9]/.test(character)) return width + 0.76;
    if (/[a-z]/.test(character)) return width + 0.58;
    return width + 0.82;
  }, 0);

  // 두 글자 이름은 강조 크기를 그대로 쓰고, 그보다 긴 이름은 확대 기준의 약 80%로 낮춘다.
  if (visualWidth <= 2) return 'clamp(42px, 13.5cqw, 66px)';
  if (visualWidth <= 4) return 'clamp(34px, 10.8cqw, 53px)';
  if (visualWidth <= 8) return 'clamp(28px, 9cqw, 45px)';
  if (visualWidth <= 13) return 'clamp(22px, 7.2cqw, 36px)';
  return 'clamp(17px, 5.5cqw, 28px)';
}

export function truncateArtistName(name: string): string {
  const characters = Array.from(name.trim());
  const containsKorean = characters.some((character) => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(character));
  const limit = containsKorean ? 8 : 22;
  if (characters.length <= limit) return characters.join('');
  return `${characters.slice(0, limit).join('').trimEnd()}…`;
}

export const ARTIST_PROMO_TEMPLATES = [
  'listen-together',
  'do-you-like',
] as const;

export type ArtistPromoTemplate = (typeof ARTIST_PROMO_TEMPLATES)[number];

export function pickArtistPromoTemplate(random: () => number = Math.random): ArtistPromoTemplate {
  const index = Math.min(ARTIST_PROMO_TEMPLATES.length - 1, Math.floor(random() * ARTIST_PROMO_TEMPLATES.length));
  return ARTIST_PROMO_TEMPLATES[index];
}
