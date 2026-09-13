// 데이터 소스: 지하철 시간표 새 백엔드(/api/v1/subway/schedule) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 현재 API 스펙상 subwayStation은 이 값 하나만 존재 (한대앞역)
export const HANDAEAP_STATION = 'HANDAEAP';

// 응답 shape은 검증 전이라 unknown — 실제 파싱/타입 부여는 SubwaySchema.ts의 zod 스키마가 Repository에서 담당
export interface SubwayApiDataSource {
  getSchedule: () => Promise<ApiResponse<unknown>>;
}

export const createSubwayApiDataSource = ({ httpClient }: { httpClient: HttpClient }): SubwayApiDataSource => ({
  getSchedule: async () => parseOrThrow(await httpClient.get(`/api/v1/subway/schedule?subwayStation=${HANDAEAP_STATION}`)),
});
