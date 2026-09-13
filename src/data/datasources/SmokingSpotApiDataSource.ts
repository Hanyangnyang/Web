// 데이터 소스: ERICA 흡연 부스/구역 정적 JSON 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';
 
export interface SmokingSpotDto {
  id: string;
  name: string;
  type: 'BOOTH' | 'AREA';
  campus: string;
  coordinates: { latitude: number | null; longitude: number | null };
  hasAshtray?: boolean;
  description?: string;
  imageUrl?: string[];
}

export interface SmokingSpotApiDataSource {
    getSmokingSpots: () => Promise<SmokingSpotDto[]>;
}

export const createSmokingSpotApiDataSource = ({ httpClient }: { httpClient: HttpClient }): SmokingSpotApiDataSource => ({
    getSmokingSpots: async () => parseOrThrow(await httpClient.get('/smokingSpots.json')),
});
