import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export interface HttpClient{
    get: (path: string, headers?: Record<string, string>) => Promise<Response>;
}

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

export interface StoreLocation {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  full_address: string | null;
}

export interface PartnershipApiResponse {
  id: string;
  name: string;
  category: StoreCategory;
  is_active: boolean;
  summary_benefit?: string | null;
  location: StoreLocation;
  emoji?: string;
  kakao_place_id?: string | null;
  partnerships: Partnership[];
}

export interface PartnershipApiDataSource {
    getPartnerStores: () => Promise<PartnershipApiResponse[]>;
}

export const createPartnershipApiDataSource = ({ httpClient }: { httpClient: HttpClient }): PartnershipApiDataSource => ({
    getPartnerStores: async () => parseOrThrow(await httpClient.get('/partnerships.json')),
});