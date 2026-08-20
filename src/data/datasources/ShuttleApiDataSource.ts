// 데이터 소스: 셔틀 시간표 새 백엔드(/api/v1/shuttle) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface ShuttleTimetableDto {
  id: number;
  route: 'MORNING_DIR' | 'DIR' | 'CIRCULAR' | 'MORNING_ART' | 'ART' | 'CENTRAL';
  period: 'SEMESTER' | 'SEASONAL' | 'VACATION';
  dayType: 'WEEKDAY' | 'HOLIDAY';
  departureTime: string; // "HH:mm:ss" 
}

export interface ShuttleApiDataSource {
  getSchedule: () => Promise<ApiResponse<ShuttleTimetableDto[]>>;
}

export const createShuttleApiDataSource = ({ httpClient }: { httpClient: HttpClient }): ShuttleApiDataSource => ({
  getSchedule: async () => parseOrThrow(await httpClient.get('/api/v1/shuttle')),
});
