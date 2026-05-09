// 유스케이스: 한대앞역 실시간 지하철 도착 정보 조회
export const createGetSubwayArrivalsUseCase = ({ shuttleRepository }) => ({
  execute: (full = false, dayType = null) => shuttleRepository.getSubwayArrivals(full, dayType),
});
