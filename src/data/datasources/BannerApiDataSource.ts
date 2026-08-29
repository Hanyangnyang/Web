// 데이터 소스: 소식탭 배너 API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface BannerDto {
  id: number;
  imageUrl: string;
  altText: string;
  clickUrl: string;
  displayOrder: number;
}

export interface BannerApiDataSource {
  getBanners: () => Promise<ApiResponse<BannerDto[]>>;
}

export const createBannerApiDataSource = ({ httpClient }: { httpClient: HttpClient }): BannerApiDataSource => ({
  getBanners: async () => parseOrThrow(await httpClient.get('/api/v1/banners')),
});
