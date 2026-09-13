// 데이터 소스: 도서관 열람실 좌석 현황 API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 응답 shape은 검증 전이라 unknown — 실제 파싱/타입 부여는 LibrarySchema.ts의 zod 스키마가 Repository에서 담당
export interface LibraryApiDataSource {
  getStatus: () => Promise<ApiResponse<unknown>>;
}

export const createLibraryApiDataSource = ({ httpClient }: { httpClient: HttpClient }): LibraryApiDataSource => ({
  getStatus: async () => parseOrThrow(await httpClient.get('/api/v1/library/seats')),
});
