// 유스케이스: 소식탭 도서관 열람실 혼잡도 조회
export const createGetLibraryStatusUseCase = ({ portalRepository }) => ({
  execute: () => portalRepository.getLibrary(),
});
