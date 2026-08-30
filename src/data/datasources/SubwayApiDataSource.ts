// 데이터 소스: 지하철 시간표 새 백엔드(/api/v1/subway/schedule) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 현재 API 스펙상 subwayStation은 이 값 하나만 존재 (한대앞역)
export const HANDAEAP_STATION = 'HANDAEAP';

export interface SubwayTimetableDto {
  id: number;
  subwayStation: typeof HANDAEAP_STATION;
  subwayLine: 'LINE4' | 'SUIN';
  direction: 'UPWARD' | 'DOWNWARD';
  dayType: 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
  time: string;                        // "HH:mm:ss"
  destination: string;                 // 종착역명 (예: '불암산', '금정', '한성대입구')
  trainNo: string;
}

export interface SubwayApiDataSource {
  getSchedule: () => Promise<ApiResponse<SubwayTimetableDto[]>>;
}

export const createSubwayApiDataSource = ({ httpClient }: { httpClient: HttpClient }): SubwayApiDataSource => ({
  getSchedule: async () => parseOrThrow(await httpClient.get(`/api/v1/subway/schedule?subwayStation=${HANDAEAP_STATION}`)),
});
