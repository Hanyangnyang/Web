// 도메인 레포지토리 인터페이스: 배너 목록 제공 계약 (구현은 data 레이어의 BannerRepository)
import type { Banner } from '../entities/Banner.js';

export interface BannerRepository {
  getBanners: () => Promise<Banner[]>;
}
