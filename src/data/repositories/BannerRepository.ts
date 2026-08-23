// 레포지토리: 배너 API 응답을 Banner 엔티티 배열로 변환
import type { BannerApiDataSource } from '../datasources/BannerApiDataSource.js';
import type { BannerRepository } from '../../domain/repositories/IBannerRepository.js';

export const createBannerRepository = (
  { bannerApiDataSource }: { bannerApiDataSource: BannerApiDataSource }
): BannerRepository => ({
  getBanners: async () => {
    const res = await bannerApiDataSource.getBanners();
    // success 실패했을때 
    if (!res.success) throw new Error(res.error?.message || 'banners API returned success:false');
    // data 비어서왔을때 
    if (!Array.isArray(res.data)) throw new Error('banners API returned invalid shape');

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
