// 데이터 소스: 제휴 매장 새 백엔드(/api/v1/partnership/partnership-available) 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export type StoreCategoryDto = 'food' | 'cafe' | 'pub' | 'play' | 'life';

export interface PartnershipDto {
  partnershipId: number;
  department: string;
  benefit?: string | null;
  conditions?: string | null;
  sourceUrl?: string | null;
  photoOrder?: number | null;
  startDate: string;
  endDate: string;
}

export interface PartnerStoreDto {
  merchantId: number;
  storeName: string;
  merchantCategory: StoreCategoryDto;
  isActive: boolean;
  emoji?: string;
  latitude: number | null;
  longitude: number | null;
  fullAddress: string | null;
  kakaoPlaceId?: string | null;
  partnerships?: PartnershipDto[];
}

export interface PartnerStoreApiDataSource {
    getPartnerStores: () => Promise<ApiResponse<PartnerStoreDto[]>>;
}

export const createPartnerStoreApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PartnerStoreApiDataSource => ({
    getPartnerStores: async () => parseOrThrow(await httpClient.get('/api/v1/partnership/partnership-available')),
});
