// 데이터 소스: ERICA 캠퍼스 건물 정적 JSON 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface OpenSpaceDto {
  id: string;
  name: string;
  floor?: string;
  hint?: string;
}

export interface CampusBuildingDto {
  id: string;
  buildingNumber: string;
  name: string;
  campus: string;
  coordinates: { latitude: number | null; longitude: number | null };
  englishName?: string;
  aliases?: string[];
  description?: string;
  primaryColleges?: string[];
  openSpaces?: OpenSpaceDto[];
  facilities?: string[];
  imageUrl?: string[];
}

export interface CampusBuildingApiDataSource {
    getCampusBuildings: () => Promise<CampusBuildingDto[]>;
}

export const createCampusBuildingApiDataSource = ({ httpClient }: { httpClient: HttpClient }): CampusBuildingApiDataSource => ({
    getCampusBuildings: async () => parseOrThrow(await httpClient.get('/campusBuildings.json')),
});
