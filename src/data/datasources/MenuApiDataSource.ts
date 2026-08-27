// 데이터 소스: 학식 정보 API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 요청 파라미터
export interface GetMenuForDateParams {
  startDate: string;
  endDate: string;
}

// 응답 shape은 검증 전이라 unknown — 실제 파싱/타입 부여는 MenuSchema.ts의 zod 스키마가 Repository에서 담당
export interface MenuApiDataSource {
  getMenuForDate: (params: GetMenuForDateParams) => Promise<ApiResponse<unknown>>;
  getMenuForPeriod: () => Promise<ApiResponse<unknown>>;
}

export const createMenuApiDataSource = ({ httpClient }: { httpClient: HttpClient }): MenuApiDataSource => ({
  getMenuForDate: async ({ startDate, endDate }) => {
    const query = new URLSearchParams({ startDate, endDate });
    return parseOrThrow(await httpClient.get(`/api/v1/menu?${query.toString()}`));
  },

  getMenuForPeriod: async () => parseOrThrow(await httpClient.get('/api/v1/menu')),
});
