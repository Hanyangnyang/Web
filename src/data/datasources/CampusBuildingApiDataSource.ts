// 데이터 소스: ERICA 캠퍼스 건물 정적 JSON 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

// 응답 원본(DTO) — 도메인 엔티티가 아니라 '바깥에서 들어오는 모양' 그대로를 적는다.
// 아래 선택 필드들은 손으로 관리하는 JSON이라 실제로 빠질 수 있고, 그 빈자리는 매퍼가 기본값으로 메운다.
// (여기서 필수로 적어두면 매퍼의 ?? 방어가 타입상 죽은 코드가 되어, 나중에 누가 지워도 아무도 못 막는다)
export interface CampusBuildingApiResponse {
  id: string;
  buildingNumber: string;
  name: string;
  campus: string;
  coordinates: { latitude: number; longitude: number };
  englishName?: string;
  aliases?: string[];
  description?: string;
  primaryColleges?: string[];
  openSpaces?: string[];
  facilities?: string[];
  imageUrl?: string[];
}

export interface CampusBuildingApiDataSource {
    getCampusBuildings: () => Promise<CampusBuildingApiResponse[]>;
}

export const createCampusBuildingApiDataSource = ({ httpClient }: { httpClient: HttpClient }): CampusBuildingApiDataSource => ({
    getCampusBuildings: async () => parseOrThrow(await httpClient.get('/campusBuildings.json')),
});
