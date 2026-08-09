// 데이터 소스: 소식탭 배너 API 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface BannerApiResponse {
  id: number;
  image_url: string;
  click_url?: string | null;
  alt_text?: string;
}

export interface BannersApiResponse {
  banners: BannerApiResponse[];
}

export interface BannerApiDataSource {
  getBanners: () => Promise<BannersApiResponse>;
}

export const createBannerApiDataSource = ({ httpClient }: { httpClient: HttpClient }): BannerApiDataSource => ({
  getBanners: async () => parseOrThrow(await httpClient.get('/api/banners')),
});
