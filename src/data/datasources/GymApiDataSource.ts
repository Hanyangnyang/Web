// 데이터 소스: 체대 헬스장 시간표 새 백엔드(/api/v1/gym/gym-periods) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 응답 shape은 검증 전이라 unknown — 실제 파싱/타입 부여는 GymSchema.ts의 zod 스키마가 Repository에서 담당
export interface GymApiDataSource{
    getSchedule: () => Promise<ApiResponse<unknown>>;
}

export const createGymApiDataSource = ({httpClient}:{httpClient: HttpClient}) : GymApiDataSource => ({
    getSchedule: async () => parseOrThrow(await httpClient.get('/api/v1/gym/gym-periods')),
})
