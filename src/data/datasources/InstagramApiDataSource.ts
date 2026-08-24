// 데이터 소스: 인스타그램 프로필 조회 및 이미지 프록시 API 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface InstagramProfileApiResponse {
  username: string;
  fullName: string;
  profilePicUrl: string | null;
  success: boolean;
  error?: boolean;
  fromCache?: boolean;
  fetchedAt?: number;
}

export interface InstagramApiDataSource {
  getProfile: (username: string) => Promise<InstagramProfileApiResponse>;
}

export const createInstagramApiDataSource = ({ httpClient }: { httpClient: HttpClient }): InstagramApiDataSource => ({
  getProfile: async (username: string) =>
    parseOrThrow(await httpClient.get(`/api/insta-proxy?username=${username}`)),
});
