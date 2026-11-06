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
  // 메뉴 검색용 별칭 (예: ['엽기떡볶이', '로제떡볶이', '떡볶이']) — 화면에 목록으로 보여주는 용도가 아니라 검색 매칭용
  representativeMenus?: string[] | null;
}

export interface PartnerStoreApiDataSource {
    getPartnerStores: () => Promise<ApiResponse<PartnerStoreDto[]>>;
}

export const createPartnerStoreApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PartnerStoreApiDataSource => ({
    getPartnerStores: async () => parseOrThrow(await httpClient.get('/api/v1/partnership/partnership-available')),
});
