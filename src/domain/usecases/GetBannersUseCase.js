// 유스케이스: 소식탭 배너 목록 조회
export const createGetBannersUseCase = ({ bannerRepository }) => ({
  execute: () => bannerRepository.getBanners(),
});
