// 유스케이스: 소식탭 배너 목록 조회
import type { Banner } from '../entities/Banner.js';
import type { BannerRepository } from '../repositories/IBannerRepository.js';

export interface GetBannersUseCase {
  execute: () => Promise<Banner[]>;
}

export const createGetBannersUseCase = (
  { bannerRepository }: { bannerRepository: BannerRepository }
): GetBannersUseCase => ({
  execute: () => bannerRepository.getBanners(),
});
