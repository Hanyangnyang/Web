import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export interface HttpClient {
    get: (path: string, headers?: Record<string, string>) => Promise<Response>;
}

export interface SmokingSpotApiResponse {
  id: string;
  name: string;
  type: 'BOOTH' | 'AREA';
  campus: string;
  coordinates: { latitude: number; longitude: number };
  hasAshtray: boolean;
  description: string;
  imageUrl: string[];
}

export interface SmokingSpotApiDataSource {
    getSmokingSpots: () => Promise<SmokingSpotApiResponse[]>;
}

export const createSmokingSpotApiDataSource = ({ httpClient }: { httpClient: HttpClient }): SmokingSpotApiDataSource => ({
    getSmokingSpots: async () => parseOrThrow(await httpClient.get('/smokingSpots.json')),
});
