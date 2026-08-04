// 도메인 엔티티: 소식탭 배너 (API/DB의 snake_case 필드를 camelCase로 정규화)

export interface BannerInput {
  id: number;
  image_url: string;
  click_url?: string | null;
  alt_text?: string;
}

export interface Banner {
  id: number;
  imageUrl: string;
  clickUrl: string | null;
  altText: string;
}

export const createBanner = ({ id, image_url, click_url = null, alt_text = '' }: BannerInput): Banner => ({
  id,
  imageUrl: image_url,
  clickUrl: click_url,
  altText: alt_text,
});
