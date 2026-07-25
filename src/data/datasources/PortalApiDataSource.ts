// 데이터 소스: 소식탭 날씨·도서관 혼잡도 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export const createPortalApiDataSource = ({ httpClient }) => ({
  getWeather: async () => parseOrThrow(await httpClient.get('/api/portal?type=weather')),
  getLibrary: async () => parseOrThrow(await httpClient.get('/api/portal?type=library')),
});
