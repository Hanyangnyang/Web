// 레포지토리: 배너 API 응답을 Banner 엔티티 배열로 변환
import { createBanner } from '../../domain/entities/Banner.js';

export const createBannerRepository = ({ bannerApiDataSource }) => ({
  getBanners: async () => {
    const data = await bannerApiDataSource.getBanners();
    if (!Array.isArray(data.banners)) throw new Error('banners API returned invalid shape');
    return data.banners.map(createBanner);
  },
});
