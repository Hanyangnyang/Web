// 유스케이스: 소식탭 날씨 정보 조회
export const createGetWeatherUseCase = ({ portalRepository }) => ({
  execute: () => portalRepository.getWeather(),
});
