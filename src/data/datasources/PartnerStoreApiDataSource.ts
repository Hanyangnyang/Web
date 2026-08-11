// 데이터 소스: 단과대별 제휴 매장 정적 JSON 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export type StoreCategory = 'food' | 'cafe' | 'pub' | 'play' | 'life';

export interface PartnershipPeriod {
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export interface Partnership {
  college_id: string;
  college_name: string;
  benefit?: string | null;
  period?: PartnershipPeriod | null;
  conditions?: string | null;
  source_url?: string | null;
}

// JSON 원본은 좌표가 평평하게(latitude/longitude) 들어있다 — 도메인의 중첩 구조는 매퍼가 만든다
export interface StoreLocation {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  full_address: string | null;
}

// 응답 원본(DTO) — 선택 필드는 실제로 빠질 수 있고, 그 빈자리는 매퍼가 기본값으로 메운다.
// (예: 폐업 매장은 location·kakao_place_id가 통째로 없다)
export interface PartnershipApiResponse {
  id: string;
  name: string;
  category: StoreCategory;
  is_active: boolean;
  summary_benefit?: string | null;
  location?: Partial<StoreLocation>;
  emoji?: string;
  kakao_place_id?: string | null;
  partnerships?: Partnership[];
}

export interface PartnerStoreApiDataSource {
    getPartnerStores: () => Promise<PartnershipApiResponse[]>;
}

export const createPartnerStoreApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PartnerStoreApiDataSource => ({
    getPartnerStores: async () => parseOrThrow(await httpClient.get('/partnerships.json')),
});