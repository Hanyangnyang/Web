// 유스케이스: 인스타그램 계정의 프로필 정보 조회
export const createGetInstagramProfileUseCase = ({ instagramRepository }) => ({
  execute: (username) => instagramRepository.getProfile(username),
});
