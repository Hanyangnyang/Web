// 데이터 소스: ERICA 흡연 부스/구역 정적 JSON 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 응답 원본(DTO) 
export interface SmokingSpotApiResponse {
  id: string;
  name: string;
  type: 'BOOTH' | 'AREA';
  campus: string;
  coordinates: { latitude: number; longitude: number };
  hasAshtray?: boolean;
  description?: string;
  imageUrl?: string[];
}

export interface SmokingSpotApiDataSource {
    getSmokingSpots: () => Promise<SmokingSpotApiResponse[]>;
}

export const createSmokingSpotApiDataSource = ({ httpClient }: { httpClient: HttpClient }): SmokingSpotApiDataSource => ({
    getSmokingSpots: async () => parseOrThrow(await httpClient.get('/smokingSpots.json')),
});
