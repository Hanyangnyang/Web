// 레포지토리: 배너 API 응답을 Banner 엔티티 배열로 변환
import { apiError } from '../../infrastructure/http/HttpClient.js';
import type { BannerApiDataSource } from '../datasources/BannerApiDataSource.js';
import type { BannerRepository } from '../../domain/repositories/IBannerRepository.js';

const AREA = '배너'; // Sentry 태그용

export const createBannerRepository = (
  { bannerApiDataSource }: { bannerApiDataSource: BannerApiDataSource }
): BannerRepository => ({
  getBanners: async () => {
    const res = await bannerApiDataSource.getBanners();
    // 1. success 실패했을때, Error 반환
    if (!res.success)
      throw apiError(res.error?.message || `banners API returned 'success:false'`, { area: AREA, endpoint: res._requestUrl });

    // 2. data가 배열 형태로 오지 않았을때, Error 반환
    if (!Array.isArray(res.data)) 
      throw apiError(`banners API returned invalid shaped 'data': ${JSON.stringify(res.data)}`, { area: AREA, endpoint: res._requestUrl });

    return [...res.data]
      .filter(banner => banner.imageUrl)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(banner => ({
        id: banner.id,
        imageUrl: banner.imageUrl,
        clickUrl: banner.clickUrl,
        altText: banner.altText,
        displayOrder: banner.displayOrder,
      }));
  },
});
