import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export interface HttpClient {
    get: (path: string, headers?: Record<string, string>) => Promise<Response>;
}

export interface CampusBuildingApiResponse {
  id: string;
  buildingNumber: string;
  name: string;
  englishName: string;
  aliases: string[];
  campus: string;
  coordinates: { latitude: number; longitude: number };
  description: string;
  primaryColleges: string[];
  openSpaces: string[];
  facilities: string[];
  imageUrl: string[];
}

export interface CampusBuildingApiDataSource {
    getCampusBuildings: () => Promise<CampusBuildingApiResponse[]>;
}

export const createCampusBuildingApiDataSource = ({ httpClient }: { httpClient: HttpClient }): CampusBuildingApiDataSource => ({
    getCampusBuildings: async () => parseOrThrow(await httpClient.get('/campusBuildings.json')),
});
