// 데이터 소스: 단과대별 제휴 매장 정적 JSON 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export type StoreCategoryDto = 'food' | 'cafe' | 'pub' | 'play' | 'life';

export interface PartnershipPeriodDto {
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
}

export interface PartnershipDto {
  college_id: string;
  college_name: string;
  benefit?: string | null;
  period?: PartnershipPeriodDto | null;
  conditions?: string | null;
  source_url?: string | null;
}

export interface StoreLocationDto {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  full_address: string | null;
}

export interface PartnerStoreDto {
  id: string;
  name: string;
  category: StoreCategoryDto;
  is_active: boolean;
  summary_benefit?: string | null;
  location?: Partial<StoreLocationDto>;
  emoji?: string;
  kakao_place_id?: string | null;
  partnerships?: PartnershipDto[];
}

export interface PartnerStoreApiDataSource {
    getPartnerStores: () => Promise<PartnerStoreDto[]>;
}

export const createPartnerStoreApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PartnerStoreApiDataSource => ({
    getPartnerStores: async () => parseOrThrow(await httpClient.get('/partnerships.json')),
});