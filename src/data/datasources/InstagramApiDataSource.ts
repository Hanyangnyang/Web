// 데이터 소스: 인스타그램 프로필 조회 및 이미지 프록시 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export const createInstagramApiDataSource = ({ httpClient }) => ({
  getProfile: async (username) =>
    parseOrThrow(await httpClient.get(`/api/insta-proxy?username=${username}`)),
});
