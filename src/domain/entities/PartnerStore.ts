// 도메인 엔티티: 제휴 매장
export type StoreCategory = 'food' | 'cafe' | 'pub' | 'play' | 'life';
export type CategoryFilter = 'all' | StoreCategory;

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

export interface PartnerStore {
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

// raw 데이터를 도메인 엔티티로 변환 — 지금은 필드가 그대로 대응되지만,
// 나중에 백엔드 API가 다른 필드명/형식으로 내려줘도 이 함수만 고치면 나머지
// 도메인/프레젠테이션 로직은 안 바뀐다
export function createPartnerStore(raw: PartnerStore): PartnerStore {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    is_active: raw.is_active,
    summary_benefit: raw.summary_benefit ?? null,
    location: {
      latitude: raw.location?.latitude ?? null,
      longitude: raw.location?.longitude ?? null,
      address: raw.location?.address ?? null,
      full_address: raw.location?.full_address ?? null,
    },
    emoji: raw.emoji,
    kakao_place_id: raw.kakao_place_id ?? null,
    partnerships: raw.partnerships ?? [],
  };
}

export function createPartnerStores(rawList: PartnerStore[]): PartnerStore[] {
  return rawList.map(createPartnerStore);
}