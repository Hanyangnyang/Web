// 도메인 엔티티: 소식탭 배너

export type BannerPlacement = 'SPLASH' | 'BANNER' | 'BOTH';

export interface Banner {
  id: number;
  imageUrl: string;
  clickUrl: string;
  altText: string;
  displayOrder: number;
  placement: BannerPlacement;
}
