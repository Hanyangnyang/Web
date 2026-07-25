// 데이터 소스: 소식탭 배너 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export const createBannerApiDataSource = ({ httpClient }) => ({
  getBanners: async () => parseOrThrow(await httpClient.get('/api/banners')),
});
