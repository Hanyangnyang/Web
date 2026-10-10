// scale: 높이가 낮은 컴팩트 배너에서 글씨를 비례해서 줄일 때 곱하는 값(기본 1)
export function getArtistNameSize(name: string, scale = 1): string {
  const visualWidth = Array.from(name).reduce((width, character) => {
    if (/\s/.test(character)) return width + 0.35;
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(character)) return width + 1;
    if (/[A-Z0-9]/.test(character)) return width + 0.76;
    if (/[a-z]/.test(character)) return width + 0.58;
    return width + 0.82;
  }, 0);
  const round = (value: number) => Number((value * scale).toFixed(1));
  const clampSize = (min: number, cqw: number, max: number) => `clamp(${round(min)}px, ${round(cqw)}cqw, ${round(max)}px)`;

  // 두 글자 이름은 강조 크기를 그대로 쓰고, 그보다 긴 이름은 확대 기준의 약 80%로 낮춘다.
  if (visualWidth <= 2) return clampSize(36, 11.5, 56);
  if (visualWidth <= 4) return clampSize(29, 9.2, 45);
  if (visualWidth <= 8) return clampSize(24, 7.7, 38);
  if (visualWidth <= 13) return clampSize(19, 6.1, 31);
  return clampSize(15, 4.7, 24);
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
